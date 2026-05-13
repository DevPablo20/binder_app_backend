import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';

@Module({
  providers: [CampaignService],
  controllers: [CampaignController]
})
export class CampaignModule {}
