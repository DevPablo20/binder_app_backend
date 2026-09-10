# binder_app_backend

API NestJS 11 + TypeORM + PostgreSQL. É o **plano de controle semântico** do data lake de mídia:
não guarda métrica de plataforma, guarda os metadados e mapeamentos que dão significado de
negócio aos fatos do lake.

**Fluxo:** plataformas exportam fatos com IDs nativos → `binder_etl` materializa no lake →
o Bridge classifica esses IDs com vocabulário de negócio → o ETL consome a publicação e
materializa o gold enriquecido → o frontend filtra por coluna.

## Estado desta branch

`arch/bridge-enrichment` reorganiza a documentação para a arquitetura decidida. **O código
ainda é o antigo.** Ao trabalhar aqui, distinga sempre:

| | Existe hoje no código | Alvo desta arquitetura |
|---|---|---|
| Bridge | `PlatformObjectMap` — tabela larga com `object_type` e validação em `assertLevelFields` | 4 tabelas, uma por nível, com as regras em constraint |
| Campanha de negócio | coluna `campaign_id` digitada em todo nível | derivada por FK composta a partir do binding |
| Formato | classificação manual por ad | traduzido de `ad_format` nativo; manual só como exceção |
| Publicação | não existe | snapshot imutável consumido pelo DAG |

Não descreva o alvo como se já existisse, e não "conserte" o código antigo fora do passo
correspondente do plano. Passos e ordem: [docs/architecture.md](docs/architecture.md).

## Camadas

| Camada | Responde | Entidades |
|---|---|---|
| **Access** | quem usa o sistema, e por qual empresa | `User`, `Company`, `UserCompany`, `Invite` |
| **Business** | a que contrato e iniciativa o dado pertence | `Client`, `Campaign` |
| **Media** | que categorias existem para descrever mídia | `Platform`, `Channel`, `BuyingType`, `Format`, `SubFormat`, `Grouping`, `SubGrouping` |
| **Bridge** | qual objeto de plataforma corresponde a qual significado | binding e classificações |

Fronteiras que não se cruzam:

- **Access** não guarda taxonomia de campanha nem ID de plataforma.
- **Business** não guarda ID nativo (`campaign_id`, `ad_group_id`, `ad_id`) — isso é Bridge.
- **Media** define vocabulário; não sabe qual ad recebe qual rótulo.
- **Bridge** referencia Business e Media por FK; nunca redefine suas regras.

## Arquitetura de enriquecimento (invariantes compartilhadas)

Valem nos três repositórios. Contradizer uma delas é bug, não escolha de implementação.

1. **Um fato: ad × dia.** `campaign`, `ad_group` e `ad` são níveis de *declaração*, não grãos
   de dado. Tudo resolve até a linha ad × dia.
2. **Um atributo, um nível.** Cada atributo é declarado em exatamente um nível e propaga para
   baixo. Sem override, sem declaração dupla — por isso não existe `coalesce` nem precedência.
3. **O nível é do negócio, não da plataforma.** Onde a plataforma guarda um dado é irrelevante.
4. **A amarração é do banco.** Integridade vira constraint (`NOT NULL`, PK composta, FK
   composta), não validação imperativa em serviço.
5. **Nada some por enriquecimento.** Soma sem filtro no fato enriquecido é idêntica à soma no
   fato cru. Todo join é `LEFT`; ausência vira categoria explícita.
6. **SCD tipo 1.** A verdade é a configuração atual; corrigir reescreve o histórico. O rastro
   de auditoria vem do snapshot de publicação, não de versionamento de linha.

| Atributo | Declarado em | Propaga para | Origem |
|---|---|---|---|
| Cliente | account | tudo abaixo | configuração |
| Campanha de negócio | campaign | ad_group, ad | configuração |
| Channel | campaign | ad_group, ad | configuração manual |
| Buying type | campaign | ad_group, ad | plano de mídia |
| Território, Persona, … | ad_group | ad | configuração |
| Format / Sub-format | ad | — | traduzido do nativo |

> Este bloco é espelhado em `binder_app_frontend/CLAUDE.md` e `binder_etl/CLAUDE.md`.
> Ao mudar, mude nos três.

## Modelo Bridge — alvo

Uma tabela por nível, porque cada nível declara coisas diferentes:

- `platform_campaign_binding` — `(platform_account_id, external_campaign_id)` único →
  `campaign_id`, `channel_id`, `buying_type_id`, todos `NOT NULL`.
- `platform_ad_group_classification` — `(platform_account_id, external_ad_group_id)` único.
  Carrega `external_campaign_id` **derivado do catálogo, nunca digitado**, com FK composta
  para o binding: classificar ad_group de campanha não vinculada é impossível.
- `platform_ad_group_grouping` — a atribuição de eixo. `PRIMARY KEY (ad_group_classification_id,
  grouping_id)` garante um valor por eixo; `FOREIGN KEY (grouping_id, sub_grouping_id)` garante
  que o valor pertence ao eixo.
- `platform_ad_classification` — `format_id` / `sub_format_id`, só como exceção à tradução.

DDL completa e o que cada constraint compra: [docs/architecture.md](docs/architecture.md).

## Regras duras

- **`synchronize: false` sempre.** Mudança de schema só por migration.
- **Matching sempre por id.** Nenhuma regra de nomenclatura, nenhum regex sobre nome de ad —
  nome é editável na plataforma e não serve de chave.
- **Nunca copie a campanha de negócio** para um nível abaixo do binding. Derive por FK; uma
  segunda cópia é uma divergência esperando acontecer.
- **Escritas do Bridge são Superadmin.** `assertSuperadmin` antes de mutação.
- Validação em DTO com `class-validator`, nunca em entidade. Todo campo exposto no Swagger
  leva `@ApiProperty()`.
- Repositórios via `@InjectRepository(Entity)` — sem token de provider customizado.
- Não editar: `dist/`, `node_modules/`, `infra/postgres_data/`.

## Comandos

```bash
npm run start:dev          # dev server
docker compose up          # app :8090, Postgres :55432
npm run build && npm run migration:generate src/system/database/migrations/<nome>
npm run migration:run      # aplica migrations pendentes
npm run seed:run           # todos os seeds (ou seed:access / seed:business / seed:media)
npm run lint               # ESLint + Prettier
npm test                   # Jest
```

O CLI de migration lê JS compilado de `dist/` — sempre `npm run build` antes de gerar ou rodar.

## Documentação

| Arquivo | Quando ler |
|---|---|
| [docs/architecture.md](docs/architecture.md) | modelo Bridge, DDL alvo, plano de migração em 10 passos |
| [docs/domain-model.md](docs/domain-model.md) | catálogo de entidades e mapa de relacionamentos |
| [docs/project-structure.md](docs/project-structure.md) | árvore de diretórios, módulos, Swagger, auth |
| [docs/tech-stack.md](docs/tech-stack.md) | versões e práticas por biblioteca |

Skill `create-entities` (`.claude/skills/create-entities/`) para criar entidade + migration
seguindo as convenções do projeto.
