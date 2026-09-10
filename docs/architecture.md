# Arquitetura — Bridge e enriquecimento

Referência detalhada do modelo Bridge alvo. As invariantes que governam tudo isso estão em
[../CLAUDE.md](../CLAUDE.md) e valem também no ETL e no frontend.

## O problema que o modelo resolve

O `PlatformObjectMap` atual é uma **união discriminada numa tabela larga**: quais colunas
valem depende de `object_type`, e a regra vive num `switch` (`assertLevelFields`). O banco não
consegue impor nada disso, os DTOs não conseguem tipar, e cada eixo novo × nível novo é mais
um ramo — crescimento multiplicativo em código.

Além disso os três níveis são **linhas irmãs, não uma árvore**. Não há FK de pai: o lake sabe
que `ad → ad_group → campaign`, o Bridge guarda três linhas soltas. Nada impede que o map de
um ad aponte para a Campanha X e o map do ad_group pai aponte para a Campanha Y.

## Modelo alvo

Uma tabela por nível, porque cada nível declara coisas diferentes.

### Nível campaign — onde a campanha de negócio nasce

```sql
platform_campaign_binding
  id                       uuid  PK
  platform_account_id      uuid  NOT NULL  FK → platform_account
  external_campaign_id     text  NOT NULL
  campaign_id              uuid  NOT NULL  FK → campaign
  channel_id               uuid  NOT NULL  FK → channel
  buying_type_id           uuid  NOT NULL  FK → buying_type

  UNIQUE (platform_account_id, external_campaign_id)
```

### Nível ad_group — só classificação por eixos

```sql
platform_ad_group_classification
  id                       uuid  PK
  platform_account_id      uuid  NOT NULL
  external_ad_group_id     text  NOT NULL
  external_campaign_id     text  NOT NULL   -- derivado do catálogo, nunca digitado

  UNIQUE (platform_account_id, external_ad_group_id)

  FOREIGN KEY (platform_account_id, external_campaign_id)
    REFERENCES platform_campaign_binding (platform_account_id, external_campaign_id)
```

Essa FK composta **é a amarração**. Torna impossível classificar um ad_group cuja campanha não
foi vinculada. E como a campanha de negócio é alcançada *através* do binding em vez de copiada,
não existe segunda cópia para divergir: o cenário em que o map de um ad aponta para campanha
diferente da do seu ad_group deixa de ser representável.

### A atribuição de eixo

```sql
platform_ad_group_grouping
  ad_group_classification_id  uuid  NOT NULL
  grouping_id                 uuid  NOT NULL   -- desnormalizado de propósito
  sub_grouping_id             uuid  NOT NULL

  PRIMARY KEY (ad_group_classification_id, grouping_id)
  -- ↑ um único valor por eixo, garantido pelo banco

  FOREIGN KEY (grouping_id, sub_grouping_id)
    REFERENCES sub_grouping (grouping_id, id)
  -- ↑ o valor pertence ao eixo declarado, garantido pelo banco

-- requer índice único de apoio:
CREATE UNIQUE INDEX ON sub_grouping (grouping_id, id);
```

### Nível ad — só formato, e só como exceção

```sql
platform_ad_classification
  id                       uuid  PK
  platform_account_id      uuid  NOT NULL
  external_ad_id           text  NOT NULL
  format_id                uuid  FK → format
  sub_format_id            uuid  FK → sub_format

  UNIQUE (platform_account_id, external_ad_id)
  FOREIGN KEY (format_id, sub_format_id) REFERENCES sub_format (format_id, id)
```

### Tradução de valores nativos

```sql
platform_format_mapping
  platform_id    uuid  NOT NULL  FK → platform
  native_value   text  NOT NULL   -- 'CAROUSEL_ADS', 'SINGLE_VIDEO'
  format_id      uuid  NOT NULL  FK → format
  sub_format_id  uuid  NOT NULL  FK → sub_format

  UNIQUE (platform_id, native_value)
```

O TikTok já entrega `ad_format` com cardinalidade baixa. Seis traduções por plataforma em vez
de N classificações por ad — escala com plataformas, não com volume de criativos.
`platform_ad_classification` passa a existir só quando alguém sobrescreve a tradução.

## O que sai do código e entra no schema

| Regra hoje em TypeScript | Onde passa a viver |
|---|---|
| campaign exige channel e buying type | `NOT NULL` |
| ad_group só aceita sub-agrupamentos | a tabela não tem as outras colunas |
| ad só aceita format e sub-format | idem |
| sub-agrupamento pertence à campanha do map | FK composta + cadeia de FK |
| sub-format pertence ao format | FK composta `(format_id, id)` |
| um valor por eixo | `PRIMARY KEY` |
| ad e ad_group na mesma campanha | estruturalmente irrepresentável |

`assertLevelFields` desaparece.

## Os quatro papéis da taxonomia

Hoje indistinguíveis no schema, agora separados:

| Papel | Exemplo | Onde vive |
|---|---|---|
| **Eixo** | "Território" | `Grouping` — escopado em campanha, **sem mudança** |
| **Vocabulário** | Crédito, Canais, Captação… | `SubGrouping` — **sem mudança** |
| **Atribuição** | ad_group 456 → Canais | `platform_ad_group_grouping` |
| **Resolução** | ad 789 herda Canais | join no Spark, fora deste repo |

O escopo campanha do `Grouping` **está correto**: uma campanha com três plataformas usa os
mesmos sub-agrupamentos em todas elas, porque o vocabulário pende da campanha e não da
plataforma. É isso que permite perguntar "dentro de Always On, qual plataforma teve o melhor
CTR em Cliente Azul".

## Buying type não é billing_event

O TikTok expõe `billing_event` no ad_group — como a plataforma tecnicamente cobra. O *buying
type* do Binder é o que foi contratado no plano de mídia. Compartilham vocabulário
(CPM, CPC, CPV) e não são o mesmo conceito. Um nunca deriva do outro, e por isso o nível em
que cada plataforma guarda o seu billing event é indiferente.

**Escolhendo nível sob incerteza:** descer um atributo de nível é barato e sem perda (backfill:
cada filho herda o valor do pai, depois edita-se a exceção). Subir é lossy — se os filhos
discordam, não há como escolher. Na dúvida, declare no nível mais alto.

## Publicação

Configurar não dispara processamento. Publicar sim, e uma vez só para o lote inteiro.

```sql
enrichment_publication
  id            uuid  PK
  published_at  timestamptz
  published_by  uuid  FK → user
  status        enum  pending | processing | materialized | failed
```

- Edições nas tabelas do Bridge não afetam nada no lake.
- O backend compara `MAX(updated_at)` das tabelas com o `published_at` da última publicação e
  sabe quantos objetos mudaram.
- Publicar **congela um snapshot** das tabelas sob aquele `publication_id` e marca `pending`.
- O DAG lê a última publicação `pending` — nunca as tabelas vivas.
- O gold enriquecido carrega `enrichment_publication_id`.

Isso entrega: nada reprocessa por micro-alteração; a rodada é reprodutível; o relatório diz
qual configuração o gerou (compensando parcialmente o SCD tipo 1); e republicar snapshot
antigo é rollback trivial.

**Transporte:** o backend expõe `GET /enrichment/publications/pending` e o DAG faz o fetch.
Simétrico ao `catalog-api` que já existe na direção oposta, sem credencial S3 aqui e sem
driver JDBC no Spark. São ~450 linhas de JSON hoje.

## Invariante de conservação

> A soma de qualquer métrica no gold enriquecido, sem filtro, tem que ser idêntica à soma no
> fato cru. Se divergir, o enriquecimento está comendo dado.

Três regras garantem isso: todo join de enriquecimento é `LEFT`; `NULL` vira balde explícito
(`'Não informado'`, categoria legítima que aparece nos gráficos); e a invariante é teste
automático do pipeline.

## Plano de migração

Ordem por dependência. Passos 1–3 e 8 são do `binder_etl`, 9 do frontend, o resto aqui.

| # | Passo | Repo |
|---|---|---|
| 1 | Reduzir `dedupe_columns` à chave natural mínima | etl |
| 2 | Acumular no bronze (union antes do dedupe) | etl |
| 3 | Reprocessar o medallion e verificar a recuperação das linhas | etl |
| 4 | Criar as tabelas novas do Bridge, índices de apoio e FKs compostas | **backend** |
| 5 | Migrar dados de `platform_object_map` para as três tabelas | **backend** |
| 6 | Tabela de tradução de formato + fila de pendências | **backend** |
| 7 | `enrichment_publication`, snapshot e endpoint | **backend** |
| 8 | Gold enriquecido: fetch, três `LEFT JOIN`, coluna `MAP`, teste de invariante | etl |
| 9 | Telas de configuração, alerta de não materializado, card de cobertura | frontend |
| 10 | Remover `platform_object_map` e `assertLevelFields` | **backend** |

**Passo 5 vai revelar sujeira.** Ao transformar `campaign_id` de digitado em derivado, maps de
ad apontando para campanha diferente da do ad_group vão bater na FK. Isso é o sistema
funcionando — trate como relatório a resolver, não como falha do script.

**Passo 10 só depois** do gold enriquecido estar reconciliando.

## Fora de escopo

| Item | Motivo |
|---|---|
| Segmentações (age, gender, region) | Não são enriquecimento — são quebra do fato. Exigem um segundo fato de grão maior. |
| Persona comparada entre campanhas | "Cliente Azul" não é o mesmo conceito em campanhas diferentes. |
| Override de eixo no nível de ad | Herança é pura por decisão; simplicidade escolhida sobre flexibilidade. |
| Histórico de quando a classificação mudou | SCD tipo 1 por decisão. |
| Mais de dois níveis de vocabulário | Eixo → valor cobre todos os casos levantados. |

## A verificar

| Verificação | Bloqueia |
|---|---|
| 14 campanhas para 17 advertisers é plausível, ou a extração está incompleta? | passo 3 |
| Valores distintos de `ad_format` (esperado ~6) | passo 6 |
| Delta em read-modify-write no mesmo caminho — confirmar `.cache()` em execução real | passo 2 |
