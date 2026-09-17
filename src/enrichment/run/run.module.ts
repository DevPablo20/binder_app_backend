import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationModule } from 'src/enrichment/publication/publication.module';
import { EnrichmentRun } from './enrichment-run.entity';
import { RunService } from './run.service';

@Module({
  imports: [TypeOrmModule.forFeature([EnrichmentRun]), PublicationModule],
  providers: [RunService],
  exports: [RunService],
})
export class RunModule {}
