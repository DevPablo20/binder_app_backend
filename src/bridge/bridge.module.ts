import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAccount } from './platform-account.entity';
import { PlatformObjectMap } from './platform-object-map.entity';
import { Client } from 'src/client/client.entity';
import { Platform } from 'src/platform/platform.entity';
import { Campaign } from 'src/campaign/campaign.entity';
import { Channel } from 'src/platform/channel.entity';
import { BuyingType } from 'src/platform/buying-type.entity';
import { Format } from 'src/format/format.entity';
import { SubFormat } from 'src/format/sub-format.entity';
import { SubGrouping } from 'src/grouping/sub-grouping.entity';

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
