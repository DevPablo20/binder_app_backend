import { Module } from '@nestjs/common';
import { RunModule } from 'src/enrichment/run/run.module';
import { DagController } from './dag.controller';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [RunModule],
  controllers: [DagController],
  providers: [ApiKeyGuard],
})
export class DagModule {}
