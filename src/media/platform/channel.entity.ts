import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Unique,
} from 'typeorm';
import { Platform } from './platform.entity';
import { BuyingType } from './buying-type.entity';

@Entity()
@Unique(['platform', 'name'])
export class Channel {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'name', type: 'character varying', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'character varying' })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Platform, (platform) => platform.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'platform_id', referencedColumnName: 'id' })
  platform: Platform;

  @ManyToMany(() => BuyingType, (buyingType) => buyingType.channels)
  @JoinTable({
    name: 'channel_buying_type',
    joinColumn: { name: 'channel_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'buying_type_id', referencedColumnName: 'id' },
  })
  buyingTypes: BuyingType[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
