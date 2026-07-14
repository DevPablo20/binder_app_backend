import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform } from 'src/media/platform/platform.entity';
import { PlatformAccount } from './platform-account.entity';
import { PlatformObjectMap } from './platform-object-map.entity';
import { PlatformObjectType } from 'src/shared/platform-object-type.enum';
import {
  CatalogApiClient,
  CatalogObjectType,
  EtlCatalogItem,
} from './catalog-api.client';
import {
  CatalogItemDto,
  CatalogQueryDto,
  CatalogQueryObjectType,
} from './catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogApiClient: CatalogApiClient,
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
    @InjectRepository(PlatformAccount)
    private readonly platformAccountRepository: Repository<PlatformAccount>,
    @InjectRepository(PlatformObjectMap)
    private readonly platformObjectMapRepository: Repository<PlatformObjectMap>,
  ) {}

  async getCatalog(
    platformId: string,
    query: CatalogQueryDto,
  ): Promise<CatalogItemDto[]> {
    const platform = await this.platformRepository.findOne({
      where: { id: platformId },
    });

    if (!platform) {
      throw new HttpException('Plataforma não encontrada', HttpStatus.NOT_FOUND);
    }

    if (!platform.catalogKey) {
      throw new HttpException(
        'Plataforma não possui catalogKey para o lake',
        HttpStatus.BAD_REQUEST,
      );
    }

    const etlObjectType = query.objectType as CatalogObjectType | undefined;
    const lakeItems = await this.catalogApiClient.getCatalog(
      platform.catalogKey,
      etlObjectType,
    );

    const accounts = await this.platformAccountRepository.find({
      where: {
        platform: { id: platformId },
        ...(query.clientId ? { client: { id: query.clientId } } : {}),
      },
      relations: { client: true },
    });

    const accountsByExternalId = new Map(
      accounts.map((account) => [account.externalAccountId, account]),
    );

    const accountIds = accounts.map((account) => account.id);
    const objectMaps =
      accountIds.length === 0
        ? []
        : await this.platformObjectMapRepository
            .createQueryBuilder('map')
            .innerJoinAndSelect('map.platformAccount', 'platformAccount')
            .where('platformAccount.id IN (:...accountIds)', { accountIds })
            .getMany();

    const objectMapsByKey = new Map(
      objectMaps.map((map) => [
        this.objectMapKey(
          map.platformAccount.id,
          map.objectType,
          map.externalId,
        ),
        map,
      ]),
    );

    const enriched = lakeItems.map((item) =>
      this.toCatalogItemDto(item, accountsByExternalId, objectMapsByKey),
    );

    if (query.unmatchedOnly) {
      return enriched.filter((item) => !item.isMapped);
    }

    return enriched;
  }

  private toCatalogItemDto(
    item: EtlCatalogItem,
    accountsByExternalId: Map<string, PlatformAccount>,
    objectMapsByKey: Map<string, PlatformObjectMap>,
  ): CatalogItemDto {
    const account = accountsByExternalId.get(item.account_id);
    const platformAccountId = account?.id ?? null;

    let isMapped = false;
    let platformObjectMapId: string | null = null;

    if (item.object_type === CatalogQueryObjectType.Account) {
      isMapped = Boolean(account);
    } else {
      const objectType = this.toBridgeObjectType(item.object_type);
      const externalId = this.externalIdFor(item);

      if (account && externalId) {
        const map = objectMapsByKey.get(
          this.objectMapKey(account.id, objectType, externalId),
        );
        if (map) {
          isMapped = true;
          platformObjectMapId = map.id;
        }
      }
    }

    return {
      platform: item.platform,
      objectType: item.object_type as CatalogQueryObjectType,
      accountId: item.account_id,
      accountName: item.account_name,
      campaignId: item.campaign_id,
      campaignName: item.campaign_name,
      adGroupId: item.ad_group_id,
      adGroupName: item.ad_group_name,
      adId: item.ad_id,
      adName: item.ad_name,
      isMapped,
      platformAccountId,
      platformObjectMapId,
    };
  }

  private toBridgeObjectType(
    objectType: Exclude<CatalogObjectType, 'account'>,
  ): PlatformObjectType {
    switch (objectType) {
      case 'campaign':
        return PlatformObjectType.Campaign;
      case 'ad_group':
        return PlatformObjectType.AdGroup;
      case 'ad':
        return PlatformObjectType.Ad;
    }
  }

  private externalIdFor(item: EtlCatalogItem): string | null {
    switch (item.object_type) {
      case 'campaign':
        return item.campaign_id;
      case 'ad_group':
        return item.ad_group_id;
      case 'ad':
        return item.ad_id;
      default:
        return null;
    }
  }

  private objectMapKey(
    platformAccountId: string,
    objectType: PlatformObjectType,
    externalId: string,
  ): string {
    return `${platformAccountId}:${objectType}:${externalId}`;
  }
}
