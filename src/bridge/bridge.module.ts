import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { PlatformAccountModule } from './platform-account/platform-account.module';
import { PlatformObjectMapModule } from './platform-object-map/platform-object-map.module';
import { CampaignBindingModule } from './campaign-binding/campaign-binding.module';
import { AdGroupClassificationModule } from './ad-group-classification/ad-group-classification.module';
import { AdClassificationModule } from './ad-classification/ad-classification.module';

@Module({
  imports: [
    CatalogModule,
    PlatformAccountModule,
    PlatformObjectMapModule,
    CampaignBindingModule,
    AdGroupClassificationModule,
    AdClassificationModule,
  ],
  exports: [
    CatalogModule,
    PlatformAccountModule,
    PlatformObjectMapModule,
    CampaignBindingModule,
    AdGroupClassificationModule,
    AdClassificationModule,
  ],
})
export class BridgeModule {}
