import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { PlatformAccountModule } from './platform-account/platform-account.module';
import { PlatformObjectMapModule } from './platform-object-map/platform-object-map.module';

@Module({
  imports: [CatalogModule, PlatformAccountModule, PlatformObjectMapModule],
  exports: [CatalogModule, PlatformAccountModule, PlatformObjectMapModule],
})
export class BridgeModule {}
