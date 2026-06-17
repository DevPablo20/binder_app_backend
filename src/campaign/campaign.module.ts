import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './campaign.entity';
import { Client } from 'src/client/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Client])],
})
export class CampaignModule {}
