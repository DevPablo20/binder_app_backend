import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnrichmentRunStatus } from 'src/shared/enrichment-run-status.enum';
import { EnrichmentPublicationStatus } from 'src/shared/enrichment-publication-status.enum';
import { PublicationService } from 'src/enrichment/publication/publication.service';
import { EnrichmentPublication } from 'src/enrichment/publication/enrichment-publication.entity';
import { EnrichmentRun } from './enrichment-run.entity';
import { CloseRunDto, OpenRunResultDto, RunDto } from './run.dto';

@Injectable()
export class RunService {
  constructor(
    @InjectRepository(EnrichmentRun)
    private readonly runRepository: Repository<EnrichmentRun>,
    private readonly publicationService: PublicationService,
  ) {}

  /**
   * Abre a rodada e entrega a configuração corrente na mesma chamada.
   *
   * São duas chamadas HTTP no ciclo do DAG, não três: ler a publicação **é** abrir a rodada.
   */
  async open(): Promise<OpenRunResultDto> {
    const publication = await this.publicationService.findLastPublication();

    const run = await this.runRepository.save(
      this.runRepository.create({
        publicationId: publication?.id ?? null,
        status: EnrichmentRunStatus.Running,
      }),
    );

    return {
      runId: run.id,
      publicationId: publication?.id ?? null,
      publishedAt: publication?.publishedAt ?? null,
      campaigns: publication
        ? await this.publicationService.findSnapshotCampaigns(publication.id)
        : [],
    };
  }

  /**
   * Fecha a rodada.
   *
   * Sucesso marca a publicação como materializada mesmo que ela já esteja `superseded`: quem
   * rodou, rodou. Falha é da rodada, não da publicação — a do dia seguinte tenta de novo.
   */
  async close(id: string, dto: CloseRunDto): Promise<RunDto> {
    if (dto.status === EnrichmentRunStatus.Running) {
      throw new HttpException(
        'Rodada só pode ser encerrada como success ou failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const run = await this.runRepository.findOne({ where: { id } });

    if (!run) {
      throw new HttpException('Rodada não encontrada', HttpStatus.NOT_FOUND);
    }

    if (run.finishedAt) {
      throw new HttpException('Rodada já encerrada', HttpStatus.CONFLICT);
    }

    run.finishedAt = new Date();
    run.status = dto.status;
    run.errorMessage = dto.errorMessage ?? null;

    const saved = await this.runRepository.manager.transaction(
      async (manager) => {
        const persisted = await manager.save(EnrichmentRun, run);

        if (
          dto.status === EnrichmentRunStatus.Success &&
          persisted.publicationId
        ) {
          await manager.update(
            EnrichmentPublication,
            { id: persisted.publicationId },
            { status: EnrichmentPublicationStatus.Materialized },
          );
        }

        return persisted;
      },
    );

    return this.toDto(saved);
  }

  private toDto(run: EnrichmentRun): RunDto {
    return {
      id: run.id,
      publicationId: run.publicationId,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      status: run.status,
      errorMessage: run.errorMessage,
    };
  }
}
