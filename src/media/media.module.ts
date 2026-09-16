import { Module } from '@nestjs/common';
import { PlatformModule } from './platform/platform.module';
import { FormatModule } from './format/format.module';

@Module({
  imports: [PlatformModule, FormatModule],
  exports: [PlatformModule, FormatModule],
})
export class MediaModule {}
