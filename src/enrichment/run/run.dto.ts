import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EnrichmentRunStatus } from 'src/shared/enrichment-run-status.enum';
import { SnapshotCampaignDto } from 'src/enrichment/publication/publication.dto';

export class RunDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  publicationId: string | null;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  finishedAt: Date | null;

  @ApiProperty({ enum: EnrichmentRunStatus })
  status: EnrichmentRunStatus;

  @ApiPropertyOptional({ nullable: true })
  errorMessage: string | null;
}

/** O que o DAG recebe ao abrir a rodada: a rodada e a configuração congelada que ele vai usar. */
export class OpenRunResultDto {
  @ApiProperty()
  runId: string;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Nulo quando não existe publicação alguma — a rodada roda com configuração vazia e o gold ' +
      'enriquecido sai passa-through puro',
  })
  publicationId: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ type: [SnapshotCampaignDto] })
  campaigns: SnapshotCampaignDto[];
}

export class CloseRunDto {
  @ApiProperty({
    enum: [EnrichmentRunStatus.Success, EnrichmentRunStatus.Failed],
  })
  @IsEnum(EnrichmentRunStatus)
  status: EnrichmentRunStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  errorMessage?: string;
}
