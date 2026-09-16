# binder_app_backend

API NestJS 11 + TypeORM + PostgreSQL. É o **plano de controle semântico** do data lake de mídia:
não guarda métrica de plataforma, guarda os metadados e mapeamentos que dão significado de
negócio aos fatos do lake.

**Fluxo:** plataformas exportam fatos com IDs nativos → `binder_etl` materializa no lake →
o Bridge classifica esses IDs com vocabulário de negócio → o ETL consome a publicação e
materializa o gold enriquecido → o frontend filtra por coluna.

## Iniciativa ativa

`bridge-enrichment` — plano único dos três repositórios em
`binder_etl/docs/plans/bridge-enrichment.md` (repositório irmão): passos, próxima ação,
decisões em aberto e o que existe hoje × alvo neste repo.

**O modelo Bridge alvo ainda não existe no código.** Antes de afirmar que uma entidade ou
endpoint existe, confira `src/` e a seção "Estado atual × alvo" do plano. Não "conserte" o
código legado fora do passo correspondente.

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

**Identificação e classificação.** A tabela acima tem dois tipos de linha. *Identificação* diz
a que entidade de negócio o objeto pertence — conta → cliente, campanha da plataforma →
campanha de negócio. É declarada uma vez e herdada por toda a hierarquia abaixo; nenhum nível
abaixo a digita. *Classificação* anexa atributos: channel, buying type, eixos, formato. O
vocabulário disponível para classificar um nível é limitado pelo escopo que a identificação de
cima estabeleceu — os eixos de um ad_group são os da campanha de negócio do binding dele, e
não outros. Por isso o nível de ad_group só classifica: a identificação ele herda.

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
  que o valor pertence ao eixo; `FOREIGN KEY (campaign_id, grouping_id)` garante que o eixo é
  da campanha de negócio do binding.
- `platform_ad_classification` — `format_id` / `sub_format_id`, só como exceção à tradução.

Quatro colunas são **cópia de escopo**, não declaração: `client_id` e `platform_id` no
binding, `campaign_id` na classificação de ad_group e na atribuição de eixo. Cada uma entra numa
FK composta que a impede de divergir da origem, e nenhuma delas é exposta em DTO.

DDL completa, as cinco regras de escopo e o que cada constraint compra:
[docs/architecture.md](docs/architecture.md).

## Regras duras

- **`synchronize: false` sempre.** Mudança de schema só por migration.
- **Matching sempre por id.** Nenhuma regra de nomenclatura, nenhum regex sobre nome de ad —
  nome é editável na plataforma e não serve de chave.
- **Cópia de escopo só amarrada por FK composta.** Para o banco impor que uma classificação
  pertence ao escopo da identificação de cima, a coluna de escopo precisa estar na própria
  linha — e então ela é amarrada por FK composta à origem, que é o que a impede de divergir.
  Cópia **solta** de `campaign_id`, `client_id` ou `platform_id`, sem a FK composta, é
  divergência esperando acontecer. A tabela das regras está em
  [docs/architecture.md](docs/architecture.md).
- **Uma conta de plataforma pertence a exatamente um cliente:**
  `UNIQUE (platform_id, external_account_id)` em `platform_account`. O fato do lake não
  carrega cliente, então o ETL só consegue casar pelas coordenadas externas — duas linhas
  para a mesma conta fariam o join do enriquecimento duplicar métrica, contra a invariante 5.
  O inverso é livre: um cliente pode ter várias contas, inclusive duas cobrindo períodos
  diferentes da mesma campanha de negócio.
- **Escritas do Bridge são Superadmin.** `assertSuperadmin` antes de mutação.
- **Máquina não é usuário.** Rotas consumidas pelo DAG são `@Public()` para o `AuthGuard` e
  protegidas por guard próprio, com chave de API em header. Não crie linha em `user` para robô:
  `UserSignature` pressupõe pessoa (role, empresas) e o JWT expira.
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
| [docs/architecture.md](docs/architecture.md) | modelo Bridge, DDL alvo, publicação, fora de escopo |
| [docs/domain-model.md](docs/domain-model.md) | catálogo de entidades e mapa de relacionamentos |
| [docs/project-structure.md](docs/project-structure.md) | árvore de diretórios, módulos, Swagger, auth |
| [docs/tech-stack.md](docs/tech-stack.md) | versões e práticas por biblioteca |

Skill `create-entities` (`.claude/skills/create-entities/`) para criar entidade + migration
seguindo as convenções do projeto.

## Onde cada informação mora (compartilhado)

| Tipo | Onde |
|---|---|
| Regra que vale sempre | `CLAUDE.md` |
| Como e por que funciona; desenho decidido | `docs/*.md` — no presente, sem data, sem número de passo, volumes em ordem de grandeza |
| O que falta, status, decisões em aberto, medições datadas | `docs/plans/<iniciativa>.md` |
| Ideia ainda sem escopo | `docs/plans/backlog.md` |

Iniciativa que envolve mais de um repositório tem um plano só, no repositório onde começou;
os outros apontam para ele.

Todo passo de uma iniciativa termina com: testes verdes → status e diário atualizados no
plano → regra nova sobe para o `CLAUDE.md` e mudança de desenho para `docs/` → rótulos
"alvo"/"legado" que ficaram falsos saem → a checagem abaixo volta vazia. Ao encerrar a
iniciativa, o plano é apagado e o ponteiro sai do `CLAUDE.md`.

```bash
grep -rnE "\bpasso [0-9]|\bfeito\b|[0-9]{2}/[0-9]{2}/20[0-9]{2}" CLAUDE.md docs .claude --exclude-dir=plans 2>/dev/null
```

> Este bloco é espelhado nos três repositórios. Ao mudar, mude nos três.
