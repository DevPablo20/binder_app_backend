import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAccount } from 'src/bridge/platform-account/platform-account.entity';
import { PlatformAdGroupClassification } from 'src/bridge/ad-group-classification/platform-ad-group-classification.entity';
import { PlatformCampaignBinding } from './platform-campaign-binding.entity';
import { CampaignBindingController } from './campaign-binding.controller';
import { CampaignBindingService } from './campaign-binding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformCampaignBinding,
      PlatformAccount,
      PlatformAdGroupClassification,
    ]),
  ],
  controllers: [CampaignBindingController],
  providers: [CampaignBindingService],
  exports: [CampaignBindingService],
})
export class CampaignBindingModule {}
