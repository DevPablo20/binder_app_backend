import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Channel } from './channel.entity';
import { BuyingType } from './buying-type.entity';

/**
 * Quais tipos de compra são válidos em cada canal.
 *
 * Existe como entidade explícita, e não como `@JoinTable`, porque o
 * `platform_campaign_binding` precisa de FK composta para cá — a regra 3 das regras de escopo.
 * FK não referencia tabela de junção que só vive em metadado de `@ManyToMany`.
 */
@Entity({ name: 'channel_buying_type' })
export class ChannelBuyingType {
  @PrimaryColumn({ name: 'channel_id', type: 'uuid' })
  channelId: string;

  @PrimaryColumn({ name: 'buying_type_id', type: 'uuid' })
  buyingTypeId: string;

  @ManyToOne(() => Channel, (channel) => channel.channelBuyingTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channel_id', referencedColumnName: 'id' })
  channel: Channel;

  @ManyToOne(() => BuyingType, (buyingType) => buyingType.channelLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'buying_type_id', referencedColumnName: 'id' })
  buyingType: BuyingType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
