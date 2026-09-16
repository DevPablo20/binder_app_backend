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
import { Campaign } from 'src/business/campaign/campaign.entity';
import { Channel } from 'src/media/platform/channel.entity';
import { ChannelBuyingType } from 'src/media/platform/channel-buying-type.entity';
import { PlatformAccount } from 'src/bridge/platform-account/platform-account.entity';
import { PlatformAdGroupClassification } from 'src/bridge/ad-group-classification/platform-ad-group-classification.entity';

/**
 * Nível campaign — onde a campanha de negócio nasce.
 *
 * `client_id` e `platform_id` são cópias de escopo: não são declaração, existem para que as
 * regras 1 e 2 possam ser FK. A FK composta para `platform_account` é o que impede as cópias
 * de divergirem da conta.
 */
@Entity({ name: 'platform_campaign_binding' })
@Unique(['platformAccountId', 'externalCampaignId'])
@Unique(['platformAccountId', 'externalCampaignId', 'campaignId', 'platformId']) // ancora o ad_group
@Unique(['platformId', 'externalCampaignId']) // chave do join de enriquecimento
export class PlatformCampaignBinding {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'platform_account_id', type: 'uuid' })
  platformAccountId: string;

  @Column({
    name: 'external_campaign_id',
    type: 'character varying',
    length: 255,
  })
  externalCampaignId: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'channel_id', type: 'uuid' })
  channelId: string;

  @Column({ name: 'buying_type_id', type: 'uuid' })
  buyingTypeId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'platform_id', type: 'uuid' })
  platformId: string;

  @ManyToOne(() => PlatformAccount, (account) => account.campaignBindings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'platform_account_id', referencedColumnName: 'id' },
    { name: 'client_id', referencedColumnName: 'clientId' },
    { name: 'platform_id', referencedColumnName: 'platformId' },
  ])
  platformAccount: PlatformAccount;

  // regra 1 — a campanha de negócio é do cliente da conta
  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'campaign_id', referencedColumnName: 'id' },
    { name: 'client_id', referencedColumnName: 'clientId' },
  ])
  campaign: Campaign;

  // regra 2 — o channel é da plataforma da conta
  @ManyToOne(() => Channel, { onDelete: 'NO ACTION' })
  @JoinColumn([
    { name: 'channel_id', referencedColumnName: 'id' },
    { name: 'platform_id', referencedColumnName: 'platformId' },
  ])
  channel: Channel;

  // regra 3 — o buying type é válido para o channel
  @ManyToOne(() => ChannelBuyingType, { onDelete: 'NO ACTION' })
  @JoinColumn([
    { name: 'channel_id', referencedColumnName: 'channelId' },
    { name: 'buying_type_id', referencedColumnName: 'buyingTypeId' },
  ])
  channelBuyingType: ChannelBuyingType;

  @OneToMany(
    () => PlatformAdGroupClassification,
    (classification) => classification.campaignBinding,
  )
  adGroupClassifications: PlatformAdGroupClassification[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
