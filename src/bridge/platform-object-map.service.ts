import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { PlatformObjectMap } from './platform-object-map.entity';
import { PlatformAccount } from './platform-account.entity';
import { Campaign } from 'src/business/campaign/campaign.entity';
import { Channel } from 'src/media/platform/channel.entity';
import { BuyingType } from 'src/media/platform/buying-type.entity';
import { Format } from 'src/media/format/format.entity';
import { SubFormat } from 'src/media/format/sub-format.entity';
import { SubGrouping } from 'src/media/grouping/sub-grouping.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdatePlatformObjectMapsDto,
  CreatePlatformObjectMapDto,
  PlatformObjectMapDetailDto,
  PlatformObjectMapQueryDto,
  PlatformObjectMapSummaryDto,
  UpdatePlatformObjectMapItemDto,
} from './platform-object-map.dto';

@Injectable()
export class PlatformObjectMapService {
  constructor(
    @InjectRepository(PlatformObjectMap)
    private readonly mapRepository: Repository<PlatformObjectMap>,
    @InjectRepository(PlatformAccount)
    private readonly platformAccountRepository: Repository<PlatformAccount>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(BuyingType)
    private readonly buyingTypeRepository: Repository<BuyingType>,
    @InjectRepository(Format)
    private readonly formatRepository: Repository<Format>,
    @InjectRepository(SubFormat)
    private readonly subFormatRepository: Repository<SubFormat>,
    @InjectRepository(SubGrouping)
    private readonly subGroupingRepository: Repository<SubGrouping>,
  ) {}

  async findAll(
    query: PlatformObjectMapQueryDto,
  ): Promise<PlatformObjectMapSummaryDto[]> {
    const where: FindOptionsWhere<PlatformObjectMap> = {};
    if (query.platformAccountId) {
      where.platformAccount = { id: query.platformAccountId };
    }
    if (query.campaignId) where.campaign = { id: query.campaignId };
    if (query.objectType) where.objectType = query.objectType;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const maps = await this.mapRepository.find({
      where,
      relations: {
        platformAccount: true,
        campaign: true,
        channel: true,
        buyingType: true,
        format: true,
        subFormat: true,
        subGroupings: true,
      },
      order: { createdAt: 'DESC' },
    });

    return maps.map((map) => this.toSummaryDto(map));
  }

  async findOne(id: string): Promise<PlatformObjectMapDetailDto> {
    const map = await this.findWithRelations(id);
    return this.toDetailDto(map);
  }

  async create(
    dto: CreatePlatformObjectMapDto,
    caller: UserSignature,
  ): Promise<PlatformObjectMapDetailDto> {
    this.assertSuperadmin(caller.role, 'criar mapeamentos de objetos');

    const platformAccount = await this.platformAccountRepository.findOne({
      where: { id: dto.platformAccountId },
    });
    if (!platformAccount) {
      throw new HttpException(
        'Conta de plataforma não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: dto.campaignId },
    });
    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    const refs = await this.resolveOptionalRefs({
      channelId: dto.channelId,
      buyingTypeId: dto.buyingTypeId,
      formatId: dto.formatId,
      subFormatId: dto.subFormatId,
      subGroupingIds: dto.subGroupingIds,
      campaignId: campaign.id,
    });

    const map = this.mapRepository.create({
      objectType: dto.objectType,
      externalId: dto.externalId,
      externalName: dto.externalName ?? null,
      isActive: dto.isActive ?? true,
      platformAccount,
      campaign,
      channel: refs.channel,
      buyingType: refs.buyingType,
      format: refs.format,
      subFormat: refs.subFormat,
      subGroupings: refs.subGroupings,
    });

    try {
      await this.mapRepository.save(map);
    } catch {
      throw new HttpException(
        'Objeto já mapeado para esta conta e tipo',
        HttpStatus.CONFLICT,
      );
    }

    return this.toDetailDto(await this.findWithRelations(map.id));
  }

  async updateMany(
    dto: BulkUpdatePlatformObjectMapsDto,
    caller: UserSignature,
  ): Promise<PlatformObjectMapDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar mapeamentos de objetos');

    const ids = dto.platformObjectMaps.map((item) => item.id);
    const maps = await this.mapRepository.find({
      where: { id: In(ids) },
      relations: {
        platformAccount: true,
        campaign: true,
        channel: true,
        buyingType: true,
        format: true,
        subFormat: true,
        subGroupings: true,
      },
    });

    if (maps.length !== ids.length) {
      throw new HttpException(
        'Mapeamento de objeto não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const mapsById = new Map(maps.map((map) => [map.id, map]));

    for (const item of dto.platformObjectMaps) {
      await this.applyUpdate(mapsById.get(item.id)!, item);
    }

    await this.mapRepository.manager.transaction(async (manager) =>
      manager.save(PlatformObjectMap, [...mapsById.values()]),
    );

    const updated = await this.mapRepository.find({
      where: { id: In(ids) },
      relations: {
        platformAccount: true,
        campaign: true,
        channel: true,
        buyingType: true,
        format: true,
        subFormat: true,
        subGroupings: true,
      },
    });

    return updated.map((map) => this.toDetailDto(map));
  }

  private async applyUpdate(
    map: PlatformObjectMap,
    item: UpdatePlatformObjectMapItemDto,
  ): Promise<void> {
    if (item.externalName !== undefined) map.externalName = item.externalName;
    if (item.isActive !== undefined) map.isActive = item.isActive;

    if (item.campaignId !== undefined) {
      const campaign = await this.campaignRepository.findOne({
        where: { id: item.campaignId },
      });
      if (!campaign) {
        throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
      }
      map.campaign = campaign;
    }

    const campaignId = map.campaign.id;
    const refs = await this.resolveOptionalRefs({
      channelId: item.channelId,
      buyingTypeId: item.buyingTypeId,
      formatId: item.formatId,
      subFormatId: item.subFormatId,
      subGroupingIds: item.subGroupingIds,
      campaignId,
      patchMode: true,
      current: map,
    });

    if (item.channelId !== undefined) map.channel = refs.channel;
    if (item.buyingTypeId !== undefined) map.buyingType = refs.buyingType;
    if (item.formatId !== undefined) map.format = refs.format;
    if (item.subFormatId !== undefined) map.subFormat = refs.subFormat;
    if (item.subGroupingIds !== undefined) map.subGroupings = refs.subGroupings;
  }

  private async resolveOptionalRefs(opts: {
    channelId?: string | null;
    buyingTypeId?: string | null;
    formatId?: string | null;
    subFormatId?: string | null;
    subGroupingIds?: string[];
    campaignId: string;
    patchMode?: boolean;
    current?: PlatformObjectMap;
  }): Promise<{
    channel: Channel | null;
    buyingType: BuyingType | null;
    format: Format | null;
    subFormat: SubFormat | null;
    subGroupings: SubGrouping[];
  }> {
    let channel: Channel | null =
      opts.patchMode && opts.current ? (opts.current.channel ?? null) : null;
    let buyingType: BuyingType | null =
      opts.patchMode && opts.current ? (opts.current.buyingType ?? null) : null;
    let format: Format | null =
      opts.patchMode && opts.current ? (opts.current.format ?? null) : null;
    let subFormat: SubFormat | null =
      opts.patchMode && opts.current ? (opts.current.subFormat ?? null) : null;
    let subGroupings: SubGrouping[] =
      opts.patchMode && opts.current ? (opts.current.subGroupings ?? []) : [];

    if (opts.channelId !== undefined) {
      if (opts.channelId === null) {
        channel = null;
      } else {
        const found = await this.channelRepository.findOne({
          where: { id: opts.channelId },
        });
        if (!found) {
          throw new HttpException('Canal não encontrado', HttpStatus.NOT_FOUND);
        }
        channel = found;
      }
    }

    if (opts.buyingTypeId !== undefined) {
      if (opts.buyingTypeId === null) {
        buyingType = null;
      } else {
        const found = await this.buyingTypeRepository.findOne({
          where: { id: opts.buyingTypeId },
        });
        if (!found) {
          throw new HttpException(
            'Tipo de compra não encontrado',
            HttpStatus.NOT_FOUND,
          );
        }
        buyingType = found;
      }
    }

    if (opts.formatId !== undefined) {
      if (opts.formatId === null) {
        format = null;
      } else {
        const found = await this.formatRepository.findOne({
          where: { id: opts.formatId },
        });
        if (!found) {
          throw new HttpException('Formato não encontrado', HttpStatus.NOT_FOUND);
        }
        format = found;
      }
    }

    if (opts.subFormatId !== undefined) {
      if (opts.subFormatId === null) {
        subFormat = null;
      } else {
        const found = await this.subFormatRepository.findOne({
          where: { id: opts.subFormatId },
        });
        if (!found) {
          throw new HttpException(
            'Subformato não encontrado',
            HttpStatus.NOT_FOUND,
          );
        }
        subFormat = found;
      }
    }

    if (opts.subGroupingIds !== undefined) {
      subGroupings = await this.loadSubGroupingsForCampaign(
        opts.subGroupingIds,
        opts.campaignId,
      );
    }

    return { channel, buyingType, format, subFormat, subGroupings };
  }

  private async loadSubGroupingsForCampaign(
    subGroupingIds: string[],
    campaignId: string,
  ): Promise<SubGrouping[]> {
    if (subGroupingIds.length === 0) return [];

    const uniqueIds = [...new Set(subGroupingIds)];
    const subGroupings = await this.subGroupingRepository.find({
      where: { id: In(uniqueIds) },
      relations: { grouping: { campaign: true } },
    });

    if (subGroupings.length !== uniqueIds.length) {
      throw new HttpException(
        'Subagrupamento não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    for (const subGrouping of subGroupings) {
      if (subGrouping.grouping.campaign.id !== campaignId) {
        throw new HttpException(
          'Subagrupamento não pertence à campanha do mapeamento',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return subGroupings;
  }

  private async findWithRelations(id: string): Promise<PlatformObjectMap> {
    const map = await this.mapRepository.findOne({
      where: { id },
      relations: {
        platformAccount: true,
        campaign: true,
        channel: true,
        buyingType: true,
        format: true,
        subFormat: true,
        subGroupings: true,
      },
    });

    if (!map) {
      throw new HttpException(
        'Mapeamento de objeto não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    return map;
  }

  private assertSuperadmin(userRole: Role, action: string): void {
    if (userRole !== Role.Superadmin) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toSummaryDto(map: PlatformObjectMap): PlatformObjectMapSummaryDto {
    return {
      id: map.id,
      objectType: map.objectType,
      externalId: map.externalId,
      externalName: map.externalName ?? null,
      isActive: map.isActive,
      platformAccountId: map.platformAccount.id,
      campaignId: map.campaign.id,
      channelId: map.channel?.id ?? null,
      buyingTypeId: map.buyingType?.id ?? null,
      formatId: map.format?.id ?? null,
      subFormatId: map.subFormat?.id ?? null,
      subGroupingIds: (map.subGroupings ?? []).map((sg) => sg.id),
    };
  }

  private toDetailDto(map: PlatformObjectMap): PlatformObjectMapDetailDto {
    return {
      ...this.toSummaryDto(map),
      createdAt: map.createdAt,
      updatedAt: map.updatedAt,
    };
  }
}
