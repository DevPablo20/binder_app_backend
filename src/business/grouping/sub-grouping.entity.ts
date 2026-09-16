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
@Unique(['grouping', 'name'])
export class SubGrouping {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'name', type: 'character varying', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'character varying' })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

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
