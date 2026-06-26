---
name: create-entities
description: >-
  Creates TypeORM entities and relationships for binder_app_backend following
  project conventions. Use when adding new database models, entity files,
  TypeORM relations (OneToMany, ManyToOne, ManyToMany, OneToOne), junction tables,
  or wiring entities into NestJS modules and migrations.
disable-model-invocation: true
---

# Create Entities & Relationships

NestJS 11 + TypeORM 0.3 + PostgreSQL. Schema changes are **migration-only** (`synchronize: false`).

## Before You Start

0. Read [domain-model.md](domain-model.md) to understand business context before designing schema

Clarify with the user (or infer from context):

1. Entity name and feature folder (`src/<layer>/<feature>/` — e.g. `src/business/client/`)
2. Columns: types, nullability, uniqueness, defaults
3. Enums → place in `src/shared/`, reference from entity `@Column({ enum: X })`
4. Relationships: type, owning side, cascade/delete behavior
5. Which module(s) need repository access

Read existing entities first: `src/access/user/user.entity.ts`, `src/access/company/company.entity.ts`.

## Workflow Checklist

```
- [ ] 1. Create entity file
- [ ] 2. Add/update inverse relations on related entities
- [ ] 3. Register TypeOrmModule.forFeature in module(s)
- [ ] 4. Import module in AppModule if new feature
- [ ] 5. Build + generate migration + run migration
- [ ] 6. Verify build and lint pass
- [ ] 7. Update domain-model.md (new entity section + relationship map)
```

## Entity Template

File: `src/<layer>/<feature>/<feature>.entity.ts`

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

### Entity Conventions (mandatory)

- UUID PK: `@PrimaryGeneratedColumn('uuid', { name: 'id' })`
- DB columns: **snake_case** via explicit `name` (e.g. `isActive` → `is_active`)
- Timestamps: `@CreateDateColumn` / `@UpdateDateColumn` with `timestamp with time zone`
- Sensitive fields: `select: false` (see `password` on User)
- **No** class-validator decorators on entities — validation belongs in DTOs
- Shared enums/types → `src/shared/`
- Import paths: `src/...` (match existing entities)
- Circular imports: use lazy refs in decorators — `() => OtherEntity`

## Relationship Decision

| Need | Pattern | Owning side |
|------|---------|-------------|
| Parent has many children | `@OneToMany` + `@ManyToOne` | `@ManyToOne` side (FK column) |
| Two entities, N:N | `@ManyToMany` + `@JoinTable` | One side only (see User/Company) |
| 1:1 | `@OneToOne` + `@JoinColumn` | Side that holds FK |

For patterns not yet in the codebase, see [relationships.md](relationships.md).

## ManyToMany (project canonical pattern)

**Owning side** — has `@JoinTable`:

```typescript
@ManyToMany(() => Company, (company) => company.users)
@JoinTable({
  name: 'user_company',
  joinColumn: { name: 'user_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'company_id', referencedColumnName: 'id' },
})
companies: Company[];
```

**Inverse side** — no `@JoinTable`:

```typescript
@ManyToMany(() => User, (user) => user.companies)
users: User[];
```

Junction table rules:

- Name: `<entity_a>_<entity_b>` in snake_case (singular table names)
- FK columns: `<entity>_id`
- Put `@JoinTable` on the entity that "owns" the association in business logic (User owns user↔company today)

## Module Wiring

In the module that injects the repository:

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureName } from './feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureName])],
  // ...
})
export class FeatureModule {}
```

- Register `forFeature` in **every** module that uses `@InjectRepository(Entity)`
- If Entity A is used in Module B, import `TypeOrmModule.forFeature([EntityA])` in Module B
- New feature module → add to the layer aggregator module (`AccessModule`, `BusinessModule`, etc.) and ensure layer module is in `src/app.module.ts` **after** `SystemModule`
- Entities are auto-discovered via glob in `typeorm.config.ts` — no manual entity registration

## Querying Relations

Relations are **never** eager-loaded by default. Load explicitly:

```typescript
await repo.findOne({
  where: { id },
  relations: { companies: true },
});
```

When saving ManyToMany links (see `src/system/database/seeds/media.seed.ts`):

```typescript
user.companies = [...user.companies, company];
await userRepository.save(user);
```

## Migrations

Always:

```bash
npm run build
npm run migration:generate src/system/database/migrations/<DescriptiveName>
npm run migration:run
```

- **Never** enable `synchronize`
- **Never** hand-edit generated migration SQL unless fixing a known issue
- Review generated migration for junction tables, FKs, indexes, and enum types

## Do Not

- Put validation decorators on entities
- Use camelCase DB column names
- Add `@JoinTable` on both sides of ManyToMany
- Skip `npm run build` before migration generate
- Create custom repository provider tokens — use `@InjectRepository(Entity)`

## Update Domain Model

After creating or changing an entity, update [domain-model.md](domain-model.md):

1. Copy the **New Entity Template** section and fill in business role, fields, used-by, and relationships
2. Add a row to the **Relationship Map** table
3. Update the **mermaid diagram** to include the new entity and relations
4. Document the **business rationale** for each relation — not just the TypeORM decorator choice

Do **not** skip this step when adding or changing entities.

## Verification

```bash
npm run build
npm run lint
npm run migration:show
```

Confirm: entity file exists, relations are bidirectional, modules registered, migration applied, domain-model.md updated.
