import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'src/business/client/client.entity';
import { Platform } from 'src/media/platform/platform.entity';
import { PlatformObjectMap } from 'src/bridge/platform-object-map/platform-object-map.entity';
import { PlatformAccount } from './platform-account.entity';
import { PlatformAccountController } from './platform-account.controller';
import { PlatformAccountService } from './platform-account.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformAccount,
      PlatformObjectMap,
      Client,
      Platform,
    ]),
  ],
  controllers: [PlatformAccountController],
  providers: [PlatformAccountService],
  exports: [PlatformAccountService],
})
export class PlatformAccountModule {}
