import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grouping } from './grouping.entity';
import { SubGrouping } from './sub-grouping.entity';
import { Campaign } from 'src/campaign/campaign.entity';
import { Client } from 'src/client/client.entity';
import { Company } from 'src/company/company.entity';
import { GroupingService } from './grouping.service';
import { SubGroupingService } from './sub-grouping.service';
import { GroupingController } from './grouping.controller';
import { SubGroupingController } from './sub-grouping.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grouping,
      SubGrouping,
      Campaign,
      Client,
      Company,
    ]),
  ],
  providers: [GroupingService, SubGroupingService],
  controllers: [GroupingController, SubGroupingController],
  exports: [GroupingService, SubGroupingService],
})
export class GroupingModule {}
