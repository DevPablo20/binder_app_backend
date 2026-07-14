import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CatalogObjectType = 'account' | 'campaign' | 'ad_group' | 'ad';

export interface EtlCatalogItem {
  platform: string;
  object_type: CatalogObjectType;
  account_id: string;
  account_name: string;
  campaign_id: string | null;
  campaign_name: string | null;
  ad_group_id: string | null;
  ad_group_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
}

@Injectable()
export class CatalogApiClient {
  private readonly logger = new Logger(CatalogApiClient.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (
      this.config.get<string>('CATALOG_API_BASE_URL') ?? 'http://localhost:8002'
    ).replace(/\/$/, '');
  }

  async getCatalog(
    catalogKey: string,
    objectType?: CatalogObjectType,
  ): Promise<EtlCatalogItem[]> {
    const url = new URL(`${this.baseUrl}/catalog/${encodeURIComponent(catalogKey)}`);
    if (objectType) {
      url.searchParams.set('object_type', objectType);
    }

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      this.logger.error(
        `Failed to reach catalog API at ${url.toString()}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        'Serviço de catálogo do lake indisponível',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (response.status === 404) {
      throw new HttpException(
        `Catálogo do lake não encontrado para platform: ${catalogKey}`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (response.status === 503) {
      throw new HttpException(
        `Dados de catálogo indisponíveis para platform: ${catalogKey}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!response.ok) {
      this.logger.error(
        `Catalog API returned ${response.status} for ${url.toString()}`,
      );
      throw new HttpException(
        'Erro ao consultar catálogo do lake',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return (await response.json()) as EtlCatalogItem[];
  }
}
