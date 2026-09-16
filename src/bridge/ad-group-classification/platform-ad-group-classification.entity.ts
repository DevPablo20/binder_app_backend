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
import { PlatformCampaignBinding } from 'src/bridge/campaign-binding/platform-campaign-binding.entity';
import { PlatformAdGroupGrouping } from './platform-ad-group-grouping.entity';

/**
 * Nível ad_group — só classificação por eixos. A identificação ele herda.
 *
 * A FK composta de quatro colunas para o binding **é a amarração**: torna impossível
 * classificar um ad_group cuja campanha não foi vinculada, e impede `campaign_id` e
 * `platform_id` de divergirem do binding.
 *
 * Não há relação direta para `PlatformAccount` de propósito — a FK já fixa
 * `platform_account_id`, e apagar a conta cascateia conta → binding → classificação.
 */
@Entity({ name: 'platform_ad_group_classification' })
@Unique(['platformAccountId', 'externalAdGroupId'])
@Unique(['id', 'campaignId']) // ancora a atribuicao de eixo
@Unique(['platformId', 'externalAdGroupId']) // chave do join de enriquecimento
export class PlatformAdGroupClassification {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'platform_account_id', type: 'uuid' })
  platformAccountId: string;

  @Column({
    name: 'external_ad_group_id',
    type: 'character varying',
    length: 255,
  })
  externalAdGroupId: string;

  /** Derivado do catálogo, nunca digitado. */
  @Column({
    name: 'external_campaign_id',
    type: 'character varying',
    length: 255,
  })
  externalCampaignId: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'platform_id', type: 'uuid' })
  platformId: string;

  @ManyToOne(
    () => PlatformCampaignBinding,
    (binding) => binding.adGroupClassifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn([
    { name: 'platform_account_id', referencedColumnName: 'platformAccountId' },
    {
      name: 'external_campaign_id',
      referencedColumnName: 'externalCampaignId',
    },
    { name: 'campaign_id', referencedColumnName: 'campaignId' },
    { name: 'platform_id', referencedColumnName: 'platformId' },
  ])
  campaignBinding: PlatformCampaignBinding;

  @OneToMany(
    () => PlatformAdGroupGrouping,
    (attribution) => attribution.adGroupClassification,
  )
  groupings: PlatformAdGroupGrouping[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
