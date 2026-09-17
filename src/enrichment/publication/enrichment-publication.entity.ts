import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from 'src/access/user/user.entity';
import { EnrichmentPublicationStatus } from 'src/shared/enrichment-publication-status.enum';
import { EnrichmentRun } from 'src/enrichment/run/enrichment-run.entity';
import { EnrichmentSnapshotCampaign } from './enrichment-snapshot-campaign.entity';

/**
 * A configuração do Bridge congelada num instante.
 *
 * Criada uma vez e usada em muitas rodadas: o gold enriquecido é reconstruído todo dia, mas a
 * configuração só muda quando alguém publica. Registro imutável — não existe update de conteúdo,
 * só transição de status.
 */
@Entity({ name: 'enrichment_publication' })
export class EnrichmentPublication {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @CreateDateColumn({ name: 'published_at', type: 'timestamp with time zone' })
  publishedAt: Date;

  // nulo só na publicação gênese; publicação feita pela UI sempre tem autor
  @Column({ name: 'published_by_id', type: 'uuid', nullable: true })
  publishedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'published_by_id', referencedColumnName: 'id' })
  publishedBy: User | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EnrichmentPublicationStatus,
    default: EnrichmentPublicationStatus.Pending,
  })
  status: EnrichmentPublicationStatus;

  @OneToMany(() => EnrichmentRun, (run) => run.publication)
  runs: EnrichmentRun[];

  @OneToMany(
    () => EnrichmentSnapshotCampaign,
    (snapshot) => snapshot.publication,
  )
  snapshotCampaigns: EnrichmentSnapshotCampaign[];
}
