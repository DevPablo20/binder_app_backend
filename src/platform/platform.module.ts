import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Platform } from './platform.entity';
import { Channel } from './channel.entity';
import { BuyingType } from './buying-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Platform, Channel, BuyingType])],
})
export class PlatformModule {}
