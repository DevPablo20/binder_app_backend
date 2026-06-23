import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Role } from 'src/shared/role.enum';
import { InviteStatus } from 'src/shared/invite-status.enum';
import { User } from 'src/access/user/user.entity';
import { Company } from 'src/access/company/company.entity';

@Entity()
export class Invite {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'email', type: 'character varying', length: 255 })
  email: string;

  @Column({
    name: 'token',
    type: 'character varying',
    length: 255,
    unique: true,
  })
  token: string;

  @Column({ name: 'role', type: 'enum', enum: Role })
  role: Role;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.Pending,
  })
  status: InviteStatus;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt: Date;

  @Column({
    name: 'accepted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  acceptedAt?: Date | null;

  @Column({
    name: 'refused_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  refusedAt?: Date | null;

  @Column({
    name: 'cancelled_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  cancelledAt?: Date | null;

  @ManyToOne(() => User, (user) => user.invites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invited_by_id', referencedColumnName: 'id' })
  invitedBy: User;

  @ManyToMany(() => Company)
  @JoinTable({
    name: 'invite_company',
    joinColumn: { name: 'invite_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'company_id', referencedColumnName: 'id' },
  })
  companies: Company[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
