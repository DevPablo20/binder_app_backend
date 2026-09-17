---
name: create-entities
description: Cria entidades TypeORM, relacionamentos e migrations no binder_app_backend seguindo as convenções do projeto. Use ao adicionar modelos de banco, arquivos de entidade, relações TypeORM (OneToMany, ManyToOne, ManyToMany, OneToOne), chaves compostas, tabelas de junção, ou ao ligar entidades a módulos NestJS e migrations.
---

# Criar entidades e relacionamentos

NestJS 11 + TypeORM 0.3 + PostgreSQL. Mudança de schema é **só por migration**
(`synchronize: false`).

## Antes de começar

Leia [docs/domain-model.md](../../../docs/domain-model.md) para o contexto de negócio, e
[docs/architecture.md](../../../docs/architecture.md) se a entidade for do Bridge.

Esclareça com o usuário, ou infira do contexto:

1. Nome da entidade e pasta (`src/<camada>/<feature>/`)
2. Colunas: tipos, nulabilidade, unicidade, defaults
3. Enums → `src/shared/`, referenciados por `@Column({ enum: X })`
4. Relacionamentos: tipo, lado dono, comportamento de cascade/delete
5. Quais módulos precisam de acesso ao repositório

Leia entidades existentes primeiro: `src/access/user/user.entity.ts`,
`src/access/company/company.entity.ts`.

## Checklist

```
- [ ] 1. Criar arquivo da entidade
- [ ] 2. Adicionar/atualizar relações inversas nas entidades relacionadas
- [ ] 3. Registrar TypeOrmModule.forFeature nos módulos
- [ ] 4. Importar módulo no AppModule se for feature nova
- [ ] 5. Build + gerar migration + rodar migration
- [ ] 6. Verificar que build e lint passam
- [ ] 7. Atualizar docs/domain-model.md (seção da entidade + mapa de relacionamentos)
```

## Template

Arquivo: `src/<camada>/<feature>/<feature>.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class FeatureName {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'name', type: 'character varying', length: 255 })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

### Convenções obrigatórias

- PK uuid: `@PrimaryGeneratedColumn('uuid', { name: 'id' })`
- Colunas em **snake_case** via `name` explícito (`isActive` → `is_active`)
- **A propriedade espelha a coluna.** `snake_case(propriedade)` tem que ser igual ao `name`:
  `clientId` ↔ `client_id`, `publicationId` ↔ `publication_id`. Propriedade com nome que não
  corresponde a nenhuma coluna parece coluna fantasma para quem lê a entidade e vai procurar no
  banco. FK de usuário segue `<acao>_by_id` (`invited_by_id`, `published_by_id`). DDL escrita
  em documento de decisão não manda na nomenclatura — a convenção do código vence, e o documento
  é que se corrige
- Timestamps com `timestamp with time zone`
- Campos sensíveis: `select: false` (ver `password` em `User`)
- **Nunca** decorators de class-validator em entidade — validação é no DTO
- Enums e tipos compartilhados em `src/shared/`
- Imports circulares: refs lazy no decorator — `() => OutraEntidade`

## Escolha do relacionamento

| Necessidade | Padrão | Lado dono |
|---|---|---|
| Pai tem muitos filhos | `@OneToMany` + `@ManyToOne` | lado `@ManyToOne` (coluna FK) |
| N:N simples | `@ManyToMany` + `@JoinTable` | um lado só |
| 1:1 | `@OneToOne` + `@JoinColumn` | lado que carrega a FK |
| N:N **com regra no vínculo** | entidade explícita | ver abaixo |

Padrões ainda não presentes no código: [relationships.md](relationships.md).

## Chaves compostas — o padrão do Bridge

A arquitetura de enriquecimento move integridade de código para constraint, e isso depende
de **PK composta** e **FK composta**. Leia
[docs/architecture.md](../../../docs/architecture.md) antes de implementar.

### FK composta

`@JoinColumn` aceita um array de colunas. As colunas referenciadas precisam de um índice
único no destino, senão o Postgres recusa a FK.

```typescript
// platform-ad-group-classification.entity.ts
@ManyToOne(() => PlatformCampaignBinding, (b) => b.adGroupClassifications, {
  onDelete: 'CASCADE',
})
@JoinColumn([
  { name: 'platform_account_id', referencedColumnName: 'platformAccountId' },
  { name: 'external_campaign_id', referencedColumnName: 'externalCampaignId' },
  { name: 'campaign_id', referencedColumnName: 'campaignId' },
  { name: 'platform_id', referencedColumnName: 'platformId' },
])
campaignBinding: PlatformCampaignBinding;
```

Três coisas que o TypeORM 0.3 exige e não avisa:

1. **Coluna de junção precisa de `@Column` explícito** — na entidade que aponta *e* na
   referenciada. `referencedColumnName` resolve por `propertyName` entre as colunas próprias
   do destino; não enxerga relações.
2. **O índice único de apoio nunca é gerado para `@ManyToOne`.** Declare `@Unique` no destino
   com exatamente as mesmas colunas da FK — Postgres exige correspondência exata, não
   subconjunto. Uma FK de 4 colunas não se ancora num único de 3.
3. **`length` não é herdado.** Se as duas pontas de uma coluna `varchar` divergirem no
   `length`, passa silenciosa para o schema.

### PK composta

```typescript
@Entity({ name: 'platform_ad_group_grouping' })
export class PlatformAdGroupGrouping {
  @PrimaryColumn({ name: 'ad_group_classification_id', type: 'uuid' })
  adGroupClassificationId: string;

  @PrimaryColumn({ name: 'grouping_id', type: 'uuid' })
  groupingId: string;

  @Column({ name: 'sub_grouping_id', type: 'uuid' })
  subGroupingId: string;
}
```

A PK `(classification, grouping)` é o que garante **um valor por eixo**. Não substitua por
`@ManyToMany` — o M2M não consegue exprimir essa regra.

### Índice único de apoio

Toda FK composta exige um único no destino, e ele **nunca** sai sozinho. Declare no destino:

```typescript
@Entity({ name: 'sub_grouping' })
@Unique(['groupingId', 'id'])   // ancora a FK composta de quem aponta
export class SubGrouping { ... }
```

**Nunca escreva FK ou índice à mão na migration.** O `RdbmsSchemaBuilder` derruba qualquer
constraint que esteja no banco e não nos metadados — o `migration:generate` seguinte emite um
`DROP` e a garantia evapora semanas depois. Tudo vem de decorator.

A prova de que metadado e banco batem é o **drift check**: depois de rodar a migration,
`npm run build && npm run migration:generate <path>` tem que responder
`No changes in database schema were found` e não escrever arquivo.

## ManyToMany (padrão canônico do projeto)

**Lado dono** — tem `@JoinTable`:

```typescript
@ManyToMany(() => Company, (company) => company.users)
@JoinTable({
  name: 'user_company',
  joinColumn: { name: 'user_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'company_id', referencedColumnName: 'id' },
})
companies: Company[];
```

**Lado inverso** — sem `@JoinTable`.

Nome da junção: `<entidade_a>_<entidade_b>` em snake_case singular; colunas FK `<entidade>_id`.

## Wiring de módulo

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([FeatureName])],
})
export class FeatureModule {}
```

- Registrar `forFeature` em **todo** módulo que usa `@InjectRepository(Entity)`
- Feature module novo → adicionar ao agregador de camada, e o agregador ao `AppModule`
  **depois** de `SystemModule`
- Entidades são descobertas por glob em `typeorm.config.ts` — sem registro manual

## Consultando relações

Nunca são eager por padrão:

```typescript
await repo.findOne({ where: { id }, relations: { companies: true } });
```

## Migrations

```bash
npm run build
npm run migration:generate src/system/database/migrations/<NomeDescritivo>
npm run migration:run
```

- **Nunca** habilitar `synchronize`
- **Nunca** editar SQL gerado à mão, exceto para corrigir problema conhecido
- Revisar a migration para junções, FKs, índices e tipos enum

## Não faça

- Validação em entidade
- Coluna de banco em camelCase
- `@JoinTable` nos dois lados de um ManyToMany
- Pular `npm run build` antes de gerar migration
- Token de provider customizado para repositório — use `@InjectRepository(Entity)`
- `@ManyToMany` onde a regra exige PK ou FK composta

## Atualize o modelo de domínio

Depois de criar ou alterar entidade, atualize
[docs/domain-model.md](../../../docs/domain-model.md):

1. Copie o **template de entidade nova** e preencha papel de negócio, campos e relações
2. Adicione linha no **mapa de relacionamentos**
3. Atualize o **diagrama mermaid**
4. Documente a **razão de negócio** de cada relação, não só a escolha de decorator

## Verificação

```bash
npm run build
npm run lint
npm run migration:show
```

Confirme: arquivo existe, relações bidirecionais, módulos registrados, migration aplicada,
`domain-model.md` atualizado.
