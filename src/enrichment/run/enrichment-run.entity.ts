import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EnrichmentRunStatus } from 'src/shared/enrichment-run-status.enum';
import { EnrichmentPublication } from 'src/enrichment/publication/enrichment-publication.entity';

/**
 * Uma execução do enriquecimento pelo DAG.
 *
 * Falha é da rodada, não da publicação: uma publicação já materializada não volta a ser inválida
 * porque a rodada de hoje quebrou. A do dia seguinte tenta de novo, sem limite de tentativas —
 * travar congelaria o gold também em relação ao fato novo.
 */
@Entity({ name: 'enrichment_run' })
export class EnrichmentRun {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  // nulo é legítimo: rodada que aconteceu antes de existir qualquer publicação roda com
  // configuração vazia, e o gold enriquecido sai passa-through puro
  @Column({ name: 'publication_id', type: 'uuid', nullable: true })
  publicationId: string | null;

  @ManyToOne(() => EnrichmentPublication, (publication) => publication.runs, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'publication_id', referencedColumnName: 'id' })
  publication: EnrichmentPublication | null;

  @CreateDateColumn({ name: 'started_at', type: 'timestamp with time zone' })
  startedAt: Date;

  @Column({
    name: 'finished_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  finishedAt: Date | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EnrichmentRunStatus,
    default: EnrichmentRunStatus.Running,
  })
  status: EnrichmentRunStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}
