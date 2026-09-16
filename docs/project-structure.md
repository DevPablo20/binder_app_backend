# Estrutura do projeto

API NestJS 11 + TypeORM + PostgreSQL. Camadas e invariantes: [../CLAUDE.md](../CLAUDE.md).
Modelo Bridge alvo: [architecture.md](architecture.md).

## Raiz

```
binder_app_backend/
├── CLAUDE.md               # contexto sempre carregado
├── docs/                   # referência sob demanda
├── .claude/skills/         # workflows invocáveis
├── src/                    # código (editar aqui)
├── dist/                   # compilado — não editar
├── infra/postgres_data/    # volume Postgres local (gitignored)
├── compose.yaml            # app + postgres_local
├── Dockerfile
├── .env.development
├── nest-cli.json           # sourceRoot: src
└── tsconfig.json
```

## Entrypoints

| Arquivo | Papel |
|---|---|
| `src/main.ts` | Bootstrap: Swagger (`/api`), CORS, cookie-parser, `ValidationPipe` global |
| `src/app.module.ts` | Módulo raiz — importa os agregadores de camada |

## Árvore de `src/`

```
src/
├── main.ts
├── app.module.ts
├── access/
│   ├── access.module.ts        # agregador: Auth, User, Company, UserCompany, Invite
│   ├── auth/                   # JWT, AuthGuard global (APP_GUARD), importa MailModule
│   │   └── decorators/         # @Public(), @Private(), @CurrentUser()
│   ├── user/  company/  user-company/  invite/
├── business/
│   ├── business.module.ts      # agregador: Client, Campaign, Grouping
│   ├── client/  campaign/
│   └── grouping/               # Grouping, SubGrouping (escopo campanha)
├── media/
│   ├── media.module.ts         # agregador: Platform, Format
│   ├── platform/               # Platform, Channel, BuyingType (catálogo global)
│   └── format/                 # Format, SubFormat (catálogo global)
├── bridge/                     # configuração: qual objeto é o quê
│   ├── bridge.module.ts        # agregador
│   ├── catalog/                # descoberta de identidades do lake + catalog-api.client
│   ├── platform-account/       # identificação conta → cliente
│   └── platform-object-map/    # LEGADO — sai no passo de remoção
├── system/
│   ├── database/               # TypeOrmModule.forRootAsync, migrations, seeds
│   └── mail/                   # MailService (sem rotas HTTP)
└── shared/
    ├── swagger/                # layer-tags.ts, swagger.config.ts
    └── role.enum.ts  role.util.ts  invite-status.enum.ts  platform-object-type.enum.ts
```

### Organização do Bridge

Uma pasta por **nível de declaração**, cada uma com seu feature module — o mesmo padrão
agregador + features das outras camadas. `BridgeModule` não tem controller nem provider
próprio; só compõe.

```
src/bridge/
├── bridge.module.ts
├── catalog/                       # identidades do lake, sem entidade própria
├── platform-account/              # identificação: conta → cliente
├── campaign-binding/              # nível campaign: binding + channel + buying type
├── ad-group-classification/       # nível ad_group: classificação + atribuição de eixo
├── ad-classification/             # nível ad: exceção de formato + tradução de nativo
└── platform-object-map/           # legado
```

### `src/enrichment/` — camada irmã

A publicação **não** é configuração do Bridge: tem outro consumidor (o DAG, não o operador),
outra autenticação (chave de API, não JWT de usuário) e outro ciclo de vida (registro imutável,
não configuração editável). Por isso mora em camada própria, que lê o Bridge e nunca o
contrário. Entidades e rotas em [architecture.md](architecture.md).

## Módulos de camada

| Módulo | Feature modules | Prefixo HTTP |
|---|---|---|
| `SystemModule` | `DatabaseModule`, `MailModule` | `system/` |
| `AccessModule` | `AuthModule`, `UserModule`, `CompanyModule`, `UserCompanyModule`, `InviteModule` | `access/` |
| `BusinessModule` | `ClientModule`, `CampaignModule`, `GroupingModule` | `business/`, `media/` (grouping) |
| `MediaModule` | `PlatformModule`, `FormatModule` | `media/` |
| `BridgeModule` | `CatalogModule`, `PlatformAccountModule`, `PlatformObjectMapModule` | `bridge/` |

Ordem em `AppModule`: `SystemModule` primeiro (DatabaseModule), depois `AccessModule` (AuthGuard).

## Padrão TypeORM

- Conexão raiz em `DatabaseModule` → `TypeOrmModule.forRootAsync` + `ConfigService`
- Repositórios de feature: `TypeOrmModule.forFeature([Entity])` no módulo que precisa
- Injeção: `@InjectRepository(Entity)` — nunca token de provider customizado
- CLI: `typeormFile.ts` em `src/system/database/` reusa `buildTypeOrmConfig()`
- Glob de entidades: `src/**/*.entity.ts`

Convenções de entidade: PK uuid via `@PrimaryGeneratedColumn('uuid')`; colunas snake_case com
`name` explícito; `@CreateDateColumn` / `@UpdateDateColumn` com `timestamp with time zone`;
relações carregadas explicitamente por `relations: { … }`.

## Auth

- `AuthGuard` global via `APP_GUARD` em `AuthModule`
- JWT no cookie `access_token` (também aceita header `Authorization`)
- `@CurrentUser()` devolve `UserSignature` (`id`, `name`, `role`, `companyIds`)
- Rotas públicas: `POST /access/auth/login`, `logout`, `password/forgot`, `password/reset`

## Swagger

UI em `/api`. Controllers usam `@ApiTags(layerTag(Layer.X, 'Recurso'))` de
`src/shared/swagger/layer-tags.ts`; `x-tagGroups` agrupa endpoints por camada.

## Wiring entre módulos

- `AuthModule` importa `MailModule` (reset de senha)
- `InviteModule` importa `MailModule` (convites)
- `UserModule` importa `UserCompanyModule` (projeção de associações)

## Convenções

- **Entidade nova**: `src/<camada>/<feature>/`; registrar no feature module; atualizar
  [domain-model.md](domain-model.md)
- **Enums e tipos compartilhados**: `src/shared/`
- **Env**: `ConfigModule` global lê `./.env.${process.env.NODE_ENV}`
- **Não editar**: `dist/`, `node_modules/`, `infra/postgres_data/`
