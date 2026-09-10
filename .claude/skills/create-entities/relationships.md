# Relationship Patterns

## ManyToOne / OneToMany

Child holds FK. Parent lists children.

```typescript
// child.entity.ts
@ManyToOne(() => Parent, (parent) => parent.children, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
parent: Parent;

// parent.entity.ts
@OneToMany(() => Child, (child) => child.parent)
children: Child[];
```

FK column `parent_id` lives on the child table.

## OneToOne

```typescript
// owning side
@OneToOne(() => Profile, (profile) => profile.user, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
profile: Profile;

// inverse side
@OneToOne(() => User, (user) => user.profile)
user: User;
```

## ManyToMany with extra columns on junction

If the junction needs metadata (e.g. `assigned_at`), do **not** use `@ManyToMany`.
Create an explicit entity:

```typescript
@Entity({ name: 'user_company' })
export class UserCompany {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamp with time zone' })
  assignedAt: Date;
}
```
