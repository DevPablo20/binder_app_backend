import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChannelBuyingType } from './channel-buying-type.entity';

@Entity({ name: 'buying_type' })
export class BuyingType {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    name: 'name',
    type: 'character varying',
    length: 255,
    unique: true,
  })
  name: string;

  @Column({ name: 'description', type: 'character varying' })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @OneToMany(() => ChannelBuyingType, (link) => link.buyingType)
  channelLinks: ChannelBuyingType[];
}
