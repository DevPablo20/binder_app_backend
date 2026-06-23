import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAccount } from './platform-account.entity';
import { PlatformObjectMap } from './platform-object-map.entity';
import { Client } from 'src/business/client/client.entity';
import { Platform } from 'src/media/platform/platform.entity';
import { Campaign } from 'src/business/campaign/campaign.entity';
import { Channel } from 'src/media/platform/channel.entity';
import { BuyingType } from 'src/media/platform/buying-type.entity';
import { Format } from 'src/media/format/format.entity';
import { SubFormat } from 'src/media/format/sub-format.entity';
import { SubGrouping } from 'src/media/grouping/sub-grouping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformAccount,
      PlatformObjectMap,
      Client,
      Platform,
      Campaign,
      Channel,
      BuyingType,
      Format,
      SubFormat,
      SubGrouping,
    ]),
  ],
})
export class BridgeModule {}
