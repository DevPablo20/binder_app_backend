import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { CampaignModule } from './campaign/campaign.module';
import { GroupingModule } from './grouping/grouping.module';

@Module({
  imports: [ClientModule, CampaignModule, GroupingModule],
  exports: [ClientModule, CampaignModule, GroupingModule],
})
export class BusinessModule {}
