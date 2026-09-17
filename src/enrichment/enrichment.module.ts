import { Module } from '@nestjs/common';
import { PublicationModule } from './publication/publication.module';
import { RunModule } from './run/run.module';
import { DagModule } from './dag/dag.module';

/**
 * Camada de enriquecimento — a ponte entre a configuração do Bridge e o lake.
 *
 * Lê o Bridge; o Bridge nunca a lê. Tem outro consumidor (o DAG, não o operador), outra
 * autenticação (chave de API, não JWT) e outro ciclo de vida (registro imutável, não configuração
 * editável) — por isso é camada, e não uma feature do Bridge.
 */
@Module({
  imports: [PublicationModule, RunModule, DagModule],
  exports: [PublicationModule, RunModule],
})
export class EnrichmentModule {}
