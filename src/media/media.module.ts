import { Module } from '@nestjs/common';
import { PlatformModule } from './platform/platform.module';
import { FormatModule } from './format/format.module';
import { GroupingModule } from './grouping/grouping.module';

@Module({
  imports: [PlatformModule, FormatModule, GroupingModule],
  exports: [PlatformModule, FormatModule, GroupingModule],
})
export class MediaModule {}
