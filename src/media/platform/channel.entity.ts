import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Platform } from './platform.entity';
import { ChannelBuyingType } from './channel-buying-type.entity';

@Entity()
@Unique(['platformId', 'name'])
@Unique(['id', 'platformId']) // ancora a regra 2 do binding
export class Channel {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'name', type: 'character varying', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'character varying' })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'platform_id', type: 'uuid' })
  platformId: string;

  @ManyToOne(() => Platform, (platform) => platform.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'platform_id', referencedColumnName: 'id' })
  platform: Platform;

  @OneToMany(() => ChannelBuyingType, (link) => link.channel, {
    cascade: ['insert', 'update'],
    orphanedRowAction: 'delete',
  })
  channelBuyingTypes: ChannelBuyingType[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
