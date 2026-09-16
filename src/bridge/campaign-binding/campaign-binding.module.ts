import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformCampaignBinding } from './platform-campaign-binding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformCampaignBinding])],
})
export class CampaignBindingModule {}
