import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAdGroupClassification } from './platform-ad-group-classification.entity';
import { PlatformAdGroupGrouping } from './platform-ad-group-grouping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformAdGroupClassification,
      PlatformAdGroupGrouping,
    ]),
  ],
})
export class AdGroupClassificationModule {}
