import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Platform } from './platform.entity';
import { Channel } from './channel.entity';
import { BuyingType } from './buying-type.entity';
import { PlatformService } from './platform.service';
import { ChannelService } from './channel.service';
import { BuyingTypeService } from './buying-type.service';
import { PlatformController } from './platform.controller';
import { ChannelController } from './channel.controller';
import { BuyingTypeController } from './buying-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Platform, Channel, BuyingType])],
  providers: [PlatformService, ChannelService, BuyingTypeService],
  controllers: [PlatformController, ChannelController, BuyingTypeController],
  exports: [PlatformService, ChannelService, BuyingTypeService],
})
export class PlatformModule {}
