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

## Identificação e classificação

Duas coisas diferentes acontecem no Bridge, e confundi-las é a origem da maior parte da
complexidade acidental do modelo antigo.

**Identificação** diz a que entidade de negócio um objeto da plataforma pertence: conta →
cliente, campanha da plataforma → campanha de negócio. É declarada **uma vez**, no nível mais
alto onde faz sentido, e herdada por toda a hierarquia abaixo pela estrutura do lake. Nenhum
nível abaixo a digita.

**Classificação** anexa atributos ao objeto: channel, buying type, eixos, formato.

A regra que liga as duas:

> O vocabulário disponível para classificar um nível é limitado pelo escopo que a
> identificação de cima estabeleceu.

Por isso o nível de ad_group **só classifica** — a identificação dele vem de ad_group →
campanha da plataforma → binding. E por isso os eixos oferecidos a um ad_group são os da
campanha de negócio daquele binding, não quaisquer eixos do sistema.

### As cinco regras de escopo

Todas têm a mesma forma, e todas viviam como validação imperativa no
`platform-object-map.service.ts`:

| # | A classificação | pertence ao escopo de | Constraint |
|---|---|---|---|
| 1 | campanha de negócio do binding | cliente da conta | `(campaign_id, client_id) → campaign (id, client_id)` |
| 2 | channel do binding | plataforma da conta | `(channel_id, platform_id) → channel (id, platform_id)` |
| 3 | buying type do binding | channel do binding | `(channel_id, buying_type_id) → channel_buying_type` |
| 4 | sub-formato | formato | `(format_id, sub_format_id) → sub_format (format_id, id)` |
| 5 | eixo do ad_group | campanha de negócio do binding | `(campaign_id, grouping_id) → grouping (campaign_id, id)` |

### A técnica

FK compara colunas **da mesma linha**, e `CHECK` não aceita subquery. Para o banco impor uma
dessas regras, a coluna de escopo precisa estar fisicamente na linha:

> **Copie a coluna de escopo para a linha e amarre a cópia por FK composta à origem.**

A cópia não é uma segunda verdade, porque o banco não permite que ela divirja. São seis no
modelo alvo — `client_id` e `platform_id` no binding, `campaign_id` na classificação de
ad_group e na atribuição de eixo, e `platform_id` nas classificações de ad_group e de ad — e
cada uma existe para tornar uma regra expressável. As duas últimas servem à chave do join de
enriquecimento, descrita adiante.

O custo é tabular: oito índices únicos de apoio, porque toda FK composta exige índice único
nas colunas referenciadas — e o TypeORM **nunca** os gera sozinho para `@ManyToOne`, todos
precisam ser declarados. O ganho é que o estado errado deixa de ser representável, em vez de
ser recusado por um `if`.

## Modelo alvo

Uma tabela por nível, porque cada nível declara coisas diferentes.

### Nível campaign — onde a campanha de negócio nasce

```sql
platform_campaign_binding
  id                       uuid  PK
  platform_account_id      uuid  NOT NULL
  external_campaign_id     text  NOT NULL
  campaign_id              uuid  NOT NULL
  channel_id               uuid  NOT NULL
  buying_type_id           uuid  NOT NULL
  client_id                uuid  NOT NULL   -- cópia de escopo, vem da conta
  platform_id              uuid  NOT NULL   -- cópia de escopo, vem da conta

  UNIQUE (platform_account_id, external_campaign_id)
  UNIQUE (platform_account_id, external_campaign_id, campaign_id, platform_id)  -- apoio ao ad_group
  UNIQUE (platform_id, external_campaign_id)   -- chave do join de enriquecimento

  FOREIGN KEY (platform_account_id, client_id, platform_id)
    REFERENCES platform_account (id, client_id, platform_id)
  -- ↑ as duas cópias não podem divergir da conta

  FOREIGN KEY (campaign_id, client_id)     REFERENCES campaign (id, client_id)    -- regra 1
  FOREIGN KEY (channel_id, platform_id)    REFERENCES channel (id, platform_id)   -- regra 2
  FOREIGN KEY (channel_id, buying_type_id)
    REFERENCES channel_buying_type (channel_id, buying_type_id)                   -- regra 3

-- requer índices únicos de apoio:
CREATE UNIQUE INDEX ON platform_account (id, client_id, platform_id);
CREATE UNIQUE INDEX ON platform_account (id, platform_id);   -- ancora o nível ad
CREATE UNIQUE INDEX ON campaign (id, client_id);
CREATE UNIQUE INDEX ON channel (id, platform_id);

-- `channel_buying_type` precisa ser entidade explícita com PK composta, não `@JoinTable`:
-- FK não referencia tabela de junção que só existe em metadado de ManyToMany.
```

### Nível ad_group — só classificação por eixos

```sql
platform_ad_group_classification
  id                       uuid  PK
  platform_account_id      uuid  NOT NULL
  external_ad_group_id     text  NOT NULL
  external_campaign_id     text  NOT NULL   -- derivado do catálogo, nunca digitado
  campaign_id              uuid  NOT NULL   -- cópia de escopo, vem do binding
  platform_id              uuid  NOT NULL   -- cópia de escopo, vem do binding

  UNIQUE (platform_account_id, external_ad_group_id)
  UNIQUE (id, campaign_id)                     -- apoio à atribuição de eixo
  UNIQUE (platform_id, external_ad_group_id)   -- chave do join de enriquecimento

  FOREIGN KEY (platform_account_id, external_campaign_id, campaign_id, platform_id)
    REFERENCES platform_campaign_binding
               (platform_account_id, external_campaign_id, campaign_id, platform_id)
```

Essa FK composta **é a amarração**. Torna impossível classificar um ad_group cuja campanha não
foi vinculada, e o cenário em que o map de um ad aponta para campanha diferente da do seu
ad_group deixa de ser representável.

O `campaign_id` aqui é cópia de escopo, não declaração: ele entra na mesma FK composta que o
binding, então não tem como apontar para outra campanha. **O DTO não expõe esse campo** — o
backend o lê do binding. Se o operador pudesse digitá-lo, a cópia deixaria de ser cópia.

**Trocar a campanha de negócio de um binding já classificado** apaga as
`platform_ad_group_classification` daquele binding, na mesma transação e antes do update: os
eixos eram da campanha antiga e a FK da regra 5 barraria a operação. Os ad_groups voltam para a
fila de pendências, que é o sinal correto para quem opera. Mesmo comportamento de trocar o
cliente de uma conta, que já apaga os filhos hoje.

### A atribuição de eixo

```sql
platform_ad_group_grouping
  ad_group_classification_id  uuid  NOT NULL
  campaign_id                 uuid  NOT NULL   -- cópia de escopo, vem da classificação
  grouping_id                 uuid  NOT NULL
  sub_grouping_id             uuid  NOT NULL

  PRIMARY KEY (ad_group_classification_id, grouping_id)
  -- ↑ um único valor por eixo, garantido pelo banco

  FOREIGN KEY (ad_group_classification_id, campaign_id)
    REFERENCES platform_ad_group_classification (id, campaign_id)
  -- ↑ a cópia de campanha não pode divergir da classificação

  FOREIGN KEY (campaign_id, grouping_id)
    REFERENCES grouping (campaign_id, id)
  -- ↑ regra 5: o eixo é da campanha de negócio do binding

  FOREIGN KEY (grouping_id, sub_grouping_id)
    REFERENCES sub_grouping (grouping_id, id)
  -- ↑ regra 4: o valor pertence ao eixo declarado

-- requer índices únicos de apoio:
CREATE UNIQUE INDEX ON grouping (campaign_id, id);
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
  platform_id              uuid  NOT NULL   -- cópia de escopo, vem da conta

  UNIQUE (platform_account_id, external_ad_id)
  UNIQUE (platform_id, external_ad_id)       -- chave do join de enriquecimento

  FOREIGN KEY (platform_account_id, platform_id)
    REFERENCES platform_account (id, platform_id)
  FOREIGN KEY (format_id, sub_format_id) REFERENCES sub_format (format_id, id)
```

### Tradução de valores nativos

```sql
platform_format_mapping
  platform_id    uuid  NOT NULL  FK → platform
  native_value   text  NOT NULL   -- 'CAROUSEL_ADS', 'SINGLE_VIDEO'
  format_id      uuid  NOT NULL  FK → format
  sub_format_id  uuid  NOT NULL  FK → sub_format

  PRIMARY KEY (platform_id, native_value)   -- é a própria unicidade que a tradução exige
  FOREIGN KEY (format_id, sub_format_id) REFERENCES sub_format (format_id, id)
```

O TikTok entrega `ad_format` com cardinalidade muito baixa (vídeo, carrossel, e nulo nos
posts autorizados). Poucas traduções por plataforma em vez de N classificações por ad —
escala com plataformas, não com volume de criativos. `platform_ad_classification` passa a
existir só quando alguém sobrescreve a tradução.

Duas restrições que o desenho precisa acomodar: `native_value` é `NOT NULL`, mas `ad_format`
pode vir nulo; e `ad_format` não carrega duração (não separa 15s de 30s), enquanto
`sub_format_id` é `NOT NULL`.

## O que sai do código e entra no schema

| Regra hoje em TypeScript | Onde passa a viver |
|---|---|
| campaign exige channel e buying type | `NOT NULL` |
| ad_group só aceita sub-agrupamentos | a tabela não tem as outras colunas |
| ad só aceita format e sub-format | idem |
| um valor por eixo | `PRIMARY KEY` |
| ad e ad_group na mesma campanha | estruturalmente irrepresentável |
| `assertClientAlignment` — campanha é do cliente da conta | regra 1 |
| `assertChannelPlatform` — channel é da plataforma da conta | regra 2 |
| `assertBuyingTypeOnChannel` — buying type vale no channel | regra 3, via `channel_buying_type` promovida a entidade |
| `assertFormatSubFormatConsistency` — sub-formato é do formato | regra 4 |
| `loadSubGroupingsForCampaign` — eixo é da campanha do map | regra 5 |

`assertLevelFields` desaparece junto com as cinco: cada tabela passa a ter só as colunas do
seu nível, então não há o que validar.

## Os quatro papéis da taxonomia

Hoje indistinguíveis no schema, agora separados:

| Papel | Exemplo | Onde vive |
|---|---|---|
| **Eixo** | "Território" | `Grouping` — escopado em campanha, schema **sem mudança** |
| **Vocabulário** | Crédito, Canais, Captação… | `SubGrouping` — **sem mudança** |
| **Atribuição** | ad_group 456 → Canais | `platform_ad_group_grouping` |
| **Resolução** | ad 789 herda Canais | join no Spark, fora deste repo |

O escopo campanha do `Grouping` **está correto**: uma campanha com três plataformas usa os
mesmos sub-agrupamentos em todas elas, porque o vocabulário pende da campanha e não da
plataforma. É isso que permite perguntar "dentro de Always On, qual plataforma teve o melhor
CTR em Cliente Azul".

`Grouping` e `SubGrouping` pertencem à camada **Business**, não a Media. Channel e Format
descrevem como a mídia foi comprada e entregue; Território e Persona descrevem como o cliente
fatia a própria campanha — e é por isso que pendem de `Campaign`. Enquanto moram em
`src/media/grouping/`, são a única entidade de Media com FK para Business; a mudança de módulo
faz o escopo por campanha deixar de parecer exceção.

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

### Os dois relógios

O gold enriquecido é produto de duas coisas que mudam em ritmos diferentes: o **fato**, que
recebe linhas novas todo dia, e a **configuração**, que muda quando alguém publica. Por isso o
gold enriquecido é reconstruído **a cada rodada diária**, mesmo quando ninguém publicou nada —
senão o fato novo ficaria sem enriquecimento.

Daí a consequência que governa todo o resto: uma publicação é criada **uma vez** e usada em
**muitas rodadas**. Publicação e rodada são coisas diferentes, e cada uma tem sua tabela.

### Modelo

```sql
enrichment_publication
  id            uuid  PK
  published_at  timestamptz  NOT NULL  DEFAULT now()
  published_by_id  uuid  NULL  FK → user
  status        enum  pending | materialized | superseded  NOT NULL  DEFAULT 'pending'

enrichment_run
  id              uuid  PK
  publication_id  uuid  NULL  FK → enrichment_publication  ON DELETE CASCADE
  started_at      timestamptz  NOT NULL  DEFAULT now()
  finished_at     timestamptz  NULL
  status          enum  running | success | failed  NOT NULL  DEFAULT 'running'
  error_message   text  NULL

enrichment_snapshot_campaign
  id                    uuid  PK
  publication_id        uuid  NOT NULL  FK → enrichment_publication  ON DELETE CASCADE
  platform_key          text  NOT NULL   -- platform.catalog_key resolvido
  external_campaign_id  text  NOT NULL
  client_name           text  NOT NULL
  campaign_name         text  NOT NULL
  channel_name          text  NOT NULL
  buying_type_name      text  NOT NULL

  UNIQUE (publication_id, platform_key, external_campaign_id)
```

A `UNIQUE` do snapshot é a `UNIQUE (platform_id, external_campaign_id)` do binding congelada aqui
dentro. Como a chave do join é frouxa de propósito (o id do objeto, sem a conta), dois candidatos
para o mesmo id duplicariam a linha do fato e dobrariam a métrica — com ela, nem um bug futuro no
Bridge publica um snapshot que quebre a conservação.

`publication_id` é **nulo** na rodada que acontece antes de existir qualquer publicação: o gold
enriquecido é construído com configuração vazia, e a rodada registra isso em vez de inventar uma
publicação que ninguém publicou. `published_by_id` só é nulo em publicação que não veio de uma pessoa.

`running` existe porque rodada aberta precisa de representação — é o estado inicial, e rodada
presa aparece como `running` com `started_at` velho. O que **não** existe é `processing` na
*publicação*: a operação é idempotente e o Airflow roda uma instância por vez.

| Status da publicação | Significado |
|---|---|
| `pending` | publicada, nunca materializada com sucesso |
| `materialized` | materializada com sucesso ao menos uma vez |
| `superseded` | descartada sem nunca ter sido usada por uma rodada |

**Falha é da rodada, não da publicação.** Uma publicação já materializada não volta a ser
inválida porque a rodada de amanhã quebrou por erro transitório de Spark. Contar falhas
consecutivas vira um `SELECT` em `enrichment_run` — e é isso que a tela mostra.

Não existe `processing`. A operação é idempotente (`Overwrite` full sobre SCD tipo 1) e o
Airflow roda uma instância por vez: não há corrida a proteger, nem publicação presa se o DAG
morrer no meio.

### Ciclo

- Edições nas tabelas do Bridge não afetam nada no lake.
- O backend compara `updated_at` com o `published_at` da última publicação e conta **duas coisas
  separadas**: vínculos criados ou editados, e nomes renomeados no vocabulário (`client`,
  `campaign`, `channel`, `buying_type`) que algum vínculo referencia. São sintomas diferentes —
  o primeiro é configuração nova, o segundo é nome velho preso no gold, já que o snapshot congela
  valor resolvido. Sem contar o segundo, renomear "Embratur" não avisaria ninguém.
- Publicar **congela um snapshot** da configuração sob aquele `publication_id`.
- Publicar de novo marca como `superseded` a publicação pendente que **não tem nenhuma rodada**:
  como o gold é `Overwrite` full, materializar a antiga seria trabalho jogado fora. Publicação
  que já foi usada por alguma rodada não é descartada — ela é história, e uma rodada que fecha com
  `success` a marca `materialized` mesmo que uma publicação mais nova já tenha chegado. Quem
  rodou, rodou.
- Cada rodada do DAG usa a publicação mais recente que não foi descartada, abre um
  `enrichment_run` e o fecha com `success` ou `failed`. Rodada que falha não trava nada — a do dia seguinte tenta de novo,
  porque reconstruir é o trabalho normal do dia. Não há limite de tentativas: travar
  congelaria o gold também em relação ao fato novo.
- **Sem publicação alguma, o gold enriquecido é construído com configuração vazia.** Snapshot
  vazio é só um snapshot com zero linhas: os `LEFT JOIN` produzem `NULL`, que vira
  `'Não informado'`. Não há caso especial no código, e o resultado é um passa-through puro —
  mesma soma *e* mesma contagem de linhas do gold base. É o teste mais sensível a fan-out que
  existe, rodando desde o primeiro dia.
- O gold enriquecido carrega `enrichment_publication_id`.

Isso entrega: nada reprocessa por micro-alteração; a rodada é reprodutível; o relatório diz
qual configuração o gerou (compensando parcialmente o SCD tipo 1); e republicar snapshot
antigo é rollback trivial.

### O snapshot congela valores, não ids

O snapshot vive em tabelas próprias sob o `publication_id`, não num JSONB — assim ele é
consultável e auditável por SQL.

E ele guarda os **valores resolvidos**, não as chaves estrangeiras. Se guardasse
`sub_grouping_id`, renomear "Crédito" para "Crédito PF" no dia seguinte mudaria o resultado de
uma publicação supostamente congelada. Resolver no momento da publicação é o que torna a
rodada reprodutível de verdade.

### Transporte e autenticação

O backend expõe a leitura da publicação corrente e a escrita do resultado da rodada; o DAG faz
duas chamadas, uma no começo e uma no fim. Simétrico ao `catalog-api` que já existe na direção
oposta, sem credencial S3 aqui e sem driver JDBC no Spark.

A assimetria com o `catalog-api` é que **esta direção escreve, e o backend é serviço público**.
O `AuthGuard` global exige JWT de um usuário real do banco, o que não serve para um robô: ele
não tem empresa, não tem e-mail, não faz login, e o token expiraria. As rotas do DAG são
`@Public()` para o `AuthGuard` e protegidas por um guard próprio que confere uma **chave de API
em header** — sem usuário fantasma na tabela `user`.

| Chamada | Rota | O quê |
|---|---|---|
| começo | `POST /enrichment/dag/runs` | abre a rodada **e** devolve o snapshot da publicação corrente |
| fim | `PATCH /enrichment/dag/runs/:id` | fecha com `success` ou `failed` |

São duas, não três: ler a publicação **é** abrir a rodada. Sem publicação alguma, a primeira
devolve `publicationId` nulo e lista de campanhas vazia — não é erro, é o passa-through puro.

Do lado do operador, as rotas são JWT como o resto do sistema: `GET
/enrichment/publications/pending-changes` alimenta o alerta da tela, `POST /enrichment/publications`
publica (Superadmin), e os `GET` de histórico e detalhe mostram o que foi congelado.

## Invariante de conservação

> A soma de qualquer métrica no gold enriquecido, sem filtro, tem que ser idêntica à soma no
> fato cru. Se divergir, o enriquecimento está comendo dado.

Três regras garantem isso: todo join de enriquecimento é `LEFT`; `NULL` vira balde explícito
(`'Não informado'`, categoria legítima que aparece nos gráficos); e a invariante é teste
automático do pipeline.

`LEFT` protege contra **perder** linha. Não protege contra **duplicar** — e duplicar quebra a
mesma invariante, para cima. É disso que trata a chave do join.

### A chave do join

O join de enriquecimento casa pelo **id do objeto**, filtrando o snapshot pela plataforma:

```sql
LEFT JOIN snapshot_campaign s ON f.campaign_id = s.external_campaign_id
LEFT JOIN snapshot_ad_group g ON f.ad_group_id = g.external_ad_group_id
```

**A conta não entra na chave.** O motivo é a origem das colunas: `campaign_id`, `ad_group_id` e
`ad_id` vêm do próprio fato e estão sempre presentes, enquanto `ad_account_id` é *derivado* da
dimensão `ads` — e `NULL` nunca casa com `NULL`. Incluir a conta amarraria a cobertura do
enriquecimento à completude de uma dimensão que o `LEFT JOIN` do gold base existe justamente
para sobreviver sem.

O preço é que o snapshot não pode ter dois candidatos para o mesmo id, senão a linha do fato
duplica e o dinheiro dobra. Daí as três unicidades por coordenada externa no Bridge:

```sql
UNIQUE (platform_id, external_campaign_id)    -- platform_campaign_binding
UNIQUE (platform_id, external_ad_group_id)    -- platform_ad_group_classification
UNIQUE (platform_id, external_ad_id)          -- platform_ad_classification
```

Elas afirmam que **um objeto da plataforma pertence a exatamente uma conta**. Com elas, o
fan-out é estruturalmente impossível e o erro aparece na tela, ao salvar — não de madrugada, no
teste de conservação.

As três não são igualmente dispensáveis, e vale saber disso antes de mexer nelas:

| Nível | O que protege além da constraint |
|---|---|
| campanha | nada — é ela que torna a chave frouxa segura |
| ad_group | a FK composta para o binding, **desde que** `external_campaign_id` esteja derivado certo; isso é garantia de serviço, não de banco |
| ad | **nada** — `platform_ad_classification` não tem cadeia para o binding, só para a conta e para o formato |

Ou seja: campanha e ad são as únicas barreiras dos seus níveis. A de ad_group troca uma
garantia de serviço por uma de banco, num modo de falha que infla métrica. Se alguma plataforma futura violar essa afirmação, a constraint recusa o
vínculo e avisa que a chave frouxa ficou insegura para ela: os dois caem juntos, que é o
comportamento desejado.

**Conta ausente não é remendada.** Quando `ad_account_id` vem nulo no gold base, o enriquecido
o mantém nulo em vez de derivá-lo do binding. A conta é coluna técnica de rastreio; o cliente e
a campanha de negócio do relatório vêm do snapshot e não dependem dela. Preencher criaria uma
segunda fonte para o mesmo atributo, contra a invariante 2, sem ganho de negócio.

## Fora de escopo

| Item | Motivo |
|---|---|
| Segmentações (age, gender, region) | Não são enriquecimento — são quebra do fato. Exigem um segundo fato de grão maior. |
| Persona comparada entre campanhas | "Cliente Azul" não é o mesmo conceito em campanhas diferentes. |
| Override de eixo no nível de ad | Herança é pura por decisão; simplicidade escolhida sobre flexibilidade. |
| Histórico de quando a classificação mudou | SCD tipo 1 por decisão. |
| Mais de dois níveis de vocabulário | Eixo → valor cobre todos os casos levantados. |
