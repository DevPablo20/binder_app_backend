import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EnrichmentPublication } from './enrichment-publication.entity';

/**
 * O snapshot do nível campanha — valores resolvidos, nunca ids.
 *
 * Se guardasse `campaign_id`, renomear a campanha no dia seguinte mudaria o resultado de uma
 * publicação supostamente congelada. Resolver no momento da publicação é o que torna a rodada
 * reprodutível.
 *
 * A unicidade é a do binding congelada aqui dentro: como a chave do join de enriquecimento é o id
 * do objeto sem a conta, dois candidatos para o mesmo id duplicariam a linha do fato e dobrariam
 * a métrica.
 */
@Entity({ name: 'enrichment_snapshot_campaign' })
@Unique(['publicationId', 'platformKey', 'externalCampaignId'])
export class EnrichmentSnapshotCampaign {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'publication_id', type: 'uuid' })
  publicationId: string;

  @ManyToOne(
    () => EnrichmentPublication,
    (publication) => publication.snapshotCampaigns,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'publication_id', referencedColumnName: 'id' })
  publication: EnrichmentPublication;

  @Column({ name: 'platform_key', type: 'character varying', length: 64 })
  platformKey: string;

  @Column({
    name: 'external_campaign_id',
    type: 'character varying',
    length: 255,
  })
  externalCampaignId: string;

  @Column({ name: 'client_name', type: 'character varying', length: 255 })
  clientName: string;

  @Column({ name: 'campaign_name', type: 'character varying', length: 255 })
  campaignName: string;

  @Column({ name: 'channel_name', type: 'character varying', length: 255 })
  channelName: string;

  @Column({ name: 'buying_type_name', type: 'character varying', length: 255 })
  buyingTypeName: string;
}
