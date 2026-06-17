import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grouping } from './grouping.entity';
import { SubGrouping } from './sub-grouping.entity';
import { Campaign } from 'src/campaign/campaign.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grouping, SubGrouping, Campaign])],
})
export class GroupingModule {}
