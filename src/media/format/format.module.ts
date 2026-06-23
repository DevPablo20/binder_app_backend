import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Format } from './format.entity';
import { SubFormat } from './sub-format.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Format, SubFormat])],
})
export class FormatModule {}
