import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Platform } from 'src/media/platform/platform.entity';
import { PlatformAccount } from 'src/bridge/platform-account/platform-account.entity';
import { PlatformObjectMap } from 'src/bridge/platform-object-map/platform-object-map.entity';
import { CatalogApiClient } from './catalog-api.client';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Platform, PlatformAccount, PlatformObjectMap]),
  ],
  controllers: [CatalogController],
  providers: [CatalogApiClient, CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
