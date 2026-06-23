import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { CampaignModule } from './campaign/campaign.module';

@Module({
  imports: [ClientModule, CampaignModule],
  exports: [ClientModule, CampaignModule],
})
export class BusinessModule {}
