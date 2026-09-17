import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrichmentPublicationStatus } from 'src/shared/enrichment-publication-status.enum';

export class PendingChangesDto {
  @ApiProperty()
  hasChanges: boolean;

  @ApiProperty({
    description: 'Vínculos criados ou editados desde a última publicação',
  })
  changedBindings: number;

  @ApiProperty({
    description:
      'Cliente, campanha, channel ou buying type renomeados desde a última publicação. O ' +
      'snapshot congela nomes: sem publicar de novo, o gold segue com o nome antigo',
  })
  changedVocabulary: number;

  @ApiPropertyOptional({ nullable: true })
  lastPublishedAt: Date | null;
}

export class SnapshotCampaignDto {
  @ApiProperty()
  platformKey: string;

  @ApiProperty()
  externalCampaignId: string;

  @ApiProperty()
  clientName: string;

  @ApiProperty()
  campaignName: string;

  @ApiProperty()
  channelName: string;

  @ApiProperty()
  buyingTypeName: string;
}

export class PublicationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  publishedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  publishedById: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedByName: string | null;

  @ApiProperty({ enum: EnrichmentPublicationStatus })
  status: EnrichmentPublicationStatus;

  @ApiProperty({ description: 'Linhas de snapshot no nível campanha' })
  snapshotCampaigns: number;

  @ApiProperty({ description: 'Rodadas que usaram esta publicação' })
  runs: number;

  @ApiPropertyOptional({ nullable: true })
  lastSuccessAt: Date | null;
}

export class PublicationDetailDto extends PublicationDto {
  @ApiProperty({ type: [SnapshotCampaignDto] })
  campaigns: SnapshotCampaignDto[];
}
