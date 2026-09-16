import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformAdClassification } from './platform-ad-classification.entity';
import { PlatformFormatMapping } from './platform-format-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformAdClassification, PlatformFormatMapping]),
  ],
})
export class AdClassificationModule {}
