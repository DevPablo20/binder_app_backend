import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from 'src/business/campaign/campaign.entity';
import { SubGrouping } from 'src/business/grouping/sub-grouping.entity';
import { BuyingType } from 'src/media/platform/buying-type.entity';
import { Channel } from 'src/media/platform/channel.entity';
import { Format } from 'src/media/format/format.entity';
import { SubFormat } from 'src/media/format/sub-format.entity';
import { PlatformAccount } from 'src/bridge/platform-account/platform-account.entity';
import { PlatformObjectMap } from './platform-object-map.entity';
import { PlatformObjectMapController } from './platform-object-map.controller';
import { PlatformObjectMapService } from './platform-object-map.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformObjectMap,
      PlatformAccount,
      Campaign,
      Channel,
      BuyingType,
      Format,
      SubFormat,
      SubGrouping,
    ]),
  ],
  controllers: [PlatformObjectMapController],
  providers: [PlatformObjectMapService],
  exports: [PlatformObjectMapService],
})
export class PlatformObjectMapModule {}
