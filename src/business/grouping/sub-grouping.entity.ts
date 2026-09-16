import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Grouping } from './grouping.entity';

@Entity({ name: 'sub_grouping' })
@Unique(['groupingId', 'name'])
@Unique(['groupingId', 'id']) // ancora a regra 4 do eixo
export class SubGrouping {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'name', type: 'character varying', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'character varying' })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'grouping_id', type: 'uuid' })
  groupingId: string;

  @ManyToOne(() => Grouping, (grouping) => grouping.subGroupings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'grouping_id', referencedColumnName: 'id' })
  grouping: Grouping;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
