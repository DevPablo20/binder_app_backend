import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformCampaignBinding } from 'src/bridge/campaign-binding/platform-campaign-binding.entity';
import { EnrichmentPublication } from './enrichment-publication.entity';
import { EnrichmentSnapshotCampaign } from './enrichment-snapshot-campaign.entity';
import { PublicationController } from './publication.controller';
import { PublicationService } from './publication.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnrichmentPublication,
      EnrichmentSnapshotCampaign,
      PlatformCampaignBinding,
    ]),
  ],
  controllers: [PublicationController],
  providers: [PublicationService],
  exports: [PublicationService],
})
export class PublicationModule {}
