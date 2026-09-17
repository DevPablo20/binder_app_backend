import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThan, Not, Repository } from 'typeorm';
import { PlatformCampaignBinding } from 'src/bridge/campaign-binding/platform-campaign-binding.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import { EnrichmentPublicationStatus } from 'src/shared/enrichment-publication-status.enum';
import { EnrichmentPublication } from './enrichment-publication.entity';
import { EnrichmentSnapshotCampaign } from './enrichment-snapshot-campaign.entity';
import {
  PendingChangesDto,
  PublicationDetailDto,
  PublicationDto,
  SnapshotCampaignDto,
} from './publication.dto';

/** Tabelas de vocabulário cujo **nome** o snapshot congela. */
const VOCABULARY_SOURCES = [
  { table: 'client', bindingColumn: 'client_id' },
  { table: 'campaign', bindingColumn: 'campaign_id' },
  { table: 'channel', bindingColumn: 'channel_id' },
  { table: 'buying_type', bindingColumn: 'buying_type_id' },
];

@Injectable()
export class PublicationService {
  constructor(
    @InjectRepository(EnrichmentPublication)
    private readonly publicationRepository: Repository<EnrichmentPublication>,
    @InjectRepository(EnrichmentSnapshotCampaign)
    private readonly snapshotRepository: Repository<EnrichmentSnapshotCampaign>,
    @InjectRepository(PlatformCampaignBinding)
    private readonly bindingRepository: Repository<PlatformCampaignBinding>,
  ) {}

  /**
   * O que mudou desde a última publicação.
   *
   * Duas contagens separadas porque são dois sintomas diferentes: vínculo alterado é
   * configuração nova, e renomeação é nome velho preso no gold — o snapshot congela valor
   * resolvido, então renomear "Embratur" não chega ao relatório até alguém publicar de novo.
   */
  async pendingChanges(): Promise<PendingChangesDto> {
    const last = await this.findLastPublication();

    if (!last) {
      const changedBindings = await this.bindingRepository.count();
      return {
        hasChanges: changedBindings > 0,
        changedBindings,
        changedVocabulary: 0,
        lastPublishedAt: null,
      };
    }

    const changedBindings = await this.bindingRepository.count({
      where: { updatedAt: MoreThan(last.publishedAt) },
    });
    const changedVocabulary = await this.countChangedVocabulary(
      last.publishedAt,
    );

    return {
      hasChanges: changedBindings > 0 || changedVocabulary > 0,
      changedBindings,
      changedVocabulary,
      lastPublishedAt: last.publishedAt,
    };
  }

  /**
   * Congela a configuração corrente sob um `publication_id`.
   *
   * Publicar não dispara processamento: quem busca é o DAG, na rodada seguinte. Snapshot vazio é
   * um snapshot válido — os `LEFT JOIN` do gold produzem `NULL`, que vira balde explícito.
   */
  async publish(caller: UserSignature): Promise<PublicationDetailDto> {
    this.assertSuperadmin(caller.role, 'publicar a configuração');

    await this.assertPlatformsHaveCatalogKey();

    const id = await this.publicationRepository.manager.transaction(
      async (manager) => {
        // superseded só na que nunca foi usada: publicação com rodada é história, não descarte
        await manager.query(
          `UPDATE enrichment_publication p
              SET status = $1
            WHERE p.status = $2
              AND NOT EXISTS (
                SELECT 1 FROM enrichment_run r WHERE r.publication_id = p.id
              )`,
          [
            EnrichmentPublicationStatus.Superseded,
            EnrichmentPublicationStatus.Pending,
          ],
        );

        const publication = await manager.save(
          EnrichmentPublication,
          manager.create(EnrichmentPublication, {
            publishedById: caller.id,
            status: EnrichmentPublicationStatus.Pending,
          }),
        );

        await this.freezeCampaignSnapshot(manager, publication.id);

        return publication.id;
      },
    );

    return this.findOne(id);
  }

  async findAll(): Promise<PublicationDto[]> {
    const rows = await this.publicationRepository.query<PublicationRow[]>(
      `${PUBLICATION_SELECT} ORDER BY p.published_at DESC`,
    );

    return rows.map(toPublicationDto);
  }

  async findOne(id: string): Promise<PublicationDetailDto> {
    const [row] = await this.publicationRepository.query<PublicationRow[]>(
      `${PUBLICATION_SELECT} WHERE p.id = $1`,
      [id],
    );

    if (!row) {
      throw new HttpException(
        'Publicação não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      ...toPublicationDto(row),
      campaigns: await this.findSnapshotCampaigns(id),
    };
  }

  async findSnapshotCampaigns(
    publicationId: string,
  ): Promise<SnapshotCampaignDto[]> {
    const rows = await this.snapshotRepository.find({
      where: { publicationId },
      order: { platformKey: 'ASC', externalCampaignId: 'ASC' },
    });

    return rows.map((row) => ({
      platformKey: row.platformKey,
      externalCampaignId: row.externalCampaignId,
      clientName: row.clientName,
      campaignName: row.campaignName,
      channelName: row.channelName,
      buyingTypeName: row.buyingTypeName,
    }));
  }

  /** A publicação corrente: a mais recente que ainda não foi descartada. */
  findLastPublication(): Promise<EnrichmentPublication | null> {
    return this.publicationRepository.findOne({
      where: { status: Not(EnrichmentPublicationStatus.Superseded) },
      order: { publishedAt: 'DESC' },
    });
  }

  /**
   * O snapshot guarda valores resolvidos, não ids: guardar `campaign_id` faria renomear a
   * campanha amanhã mudar o resultado de uma publicação supostamente congelada.
   */
  private async freezeCampaignSnapshot(
    manager: EntityManager,
    publicationId: string,
  ): Promise<void> {
    await manager.query(
      `INSERT INTO enrichment_snapshot_campaign
         (publication_id, platform_key, external_campaign_id,
          client_name, campaign_name, channel_name, buying_type_name)
       SELECT $1, p.catalog_key, b.external_campaign_id,
              cl.name, ca.name, ch.name, bt.name
         FROM platform_campaign_binding b
         JOIN platform    p  ON p.id  = b.platform_id
         JOIN client      cl ON cl.id = b.client_id
         JOIN campaign    ca ON ca.id = b.campaign_id
         JOIN channel     ch ON ch.id = b.channel_id
         JOIN buying_type bt ON bt.id = b.buying_type_id`,
      [publicationId],
    );
  }

  /**
   * `catalog_key` é o que casa o snapshot com o fato do lake. Sem ele a linha não teria como ser
   * encontrada, e a coluna do snapshot é `NOT NULL` — melhor recusar com o nome da plataforma do
   * que quebrar no meio do INSERT.
   */
  private async assertPlatformsHaveCatalogKey(): Promise<void> {
    const rows = await this.publicationRepository.query<{ name: string }[]>(
      `SELECT DISTINCT p.name
         FROM platform_campaign_binding b
         JOIN platform p ON p.id = b.platform_id
        WHERE p.catalog_key IS NULL`,
    );

    if (rows.length > 0) {
      throw new HttpException(
        `Plataforma sem catalog_key, não dá para publicar: ${rows
          .map((row) => row.name)
          .join(', ')}`,
        HttpStatus.CONFLICT,
      );
    }
  }

  private async countChangedVocabulary(since: Date): Promise<number> {
    const subqueries = VOCABULARY_SOURCES.map(
      ({ table, bindingColumn }) => `
        SELECT count(*) FROM "${table}" t
         WHERE t.updated_at > $1
           AND EXISTS (
             SELECT 1 FROM platform_campaign_binding b
              WHERE b.${bindingColumn} = t.id
           )`,
    );

    const [row] = await this.publicationRepository.query<{ count: string }[]>(
      `SELECT ${subqueries.map((sub) => `(${sub})`).join(' + ')} AS count`,
      [since],
    );

    return Number(row.count);
  }

  private assertSuperadmin(userRole: Role, action: string): void {
    if (userRole !== Role.Superadmin) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

const PUBLICATION_SELECT = `
  SELECT p.id,
         p.published_at,
         p.published_by_id,
         p.status,
         u.name AS published_by_name,
         (SELECT count(*) FROM enrichment_snapshot_campaign s
           WHERE s.publication_id = p.id) AS snapshot_campaigns,
         (SELECT count(*) FROM enrichment_run r
           WHERE r.publication_id = p.id) AS runs,
         (SELECT max(r.finished_at) FROM enrichment_run r
           WHERE r.publication_id = p.id AND r.status = 'success') AS last_success_at
    FROM enrichment_publication p
    LEFT JOIN "user" u ON u.id = p.published_by_id`;

interface PublicationRow {
  id: string;
  published_at: Date;
  published_by_id: string | null;
  published_by_name: string | null;
  status: EnrichmentPublicationStatus;
  snapshot_campaigns: string;
  runs: string;
  last_success_at: Date | null;
}

function toPublicationDto(row: PublicationRow): PublicationDto {
  return {
    id: row.id,
    publishedAt: row.published_at,
    publishedById: row.published_by_id,
    publishedByName: row.published_by_name,
    status: row.status,
    snapshotCampaigns: Number(row.snapshot_campaigns),
    runs: Number(row.runs),
    lastSuccessAt: row.last_success_at,
  };
}
