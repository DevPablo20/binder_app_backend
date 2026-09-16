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
import { PlatformObjectType } from 'src/shared/platform-object-type.enum';
import {
  BulkCreatePlatformObjectMapsDto,
  BulkDeletePlatformObjectMapsDto,
  BulkUpdatePlatformObjectMapsDto,
  CreatePlatformObjectMapDto,
  PlatformObjectMapDetailDto,
  PlatformObjectMapQueryDto,
  PlatformObjectMapSummaryDto,
  UpdatePlatformObjectMapItemDto,
} from './platform-object-map.dto';

// Relations required to build a summary/detail DTO — names come from these.
const SUMMARY_RELATIONS = {
  platformAccount: { client: true, platform: true },
  campaign: true,
  channel: true,
  buyingType: true,
  format: true,
  subFormat: true,
  subGroupings: true,
} as const;

type EnrichmentRefs = {
  channel: Channel | null;
  buyingType: BuyingType | null;
  format: Format | null;
  subFormat: SubFormat | null;
  subGroupings: SubGrouping[];
};

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
    if (query.platformAccountId || query.platformId) {
      where.platformAccount = {
        ...(query.platformAccountId ? { id: query.platformAccountId } : {}),
        ...(query.platformId ? { platform: { id: query.platformId } } : {}),
      };
    }
    if (query.campaignId) where.campaign = { id: query.campaignId };
    if (query.objectType) where.objectType = query.objectType;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const maps = await this.mapRepository.find({
      where,
      relations: SUMMARY_RELATIONS,
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
      relations: { client: true, platform: true },
    });
    if (!platformAccount) {
      throw new HttpException(
        'Conta de plataforma não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: dto.campaignId },
      relations: { client: true },
    });
    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    this.assertClientAlignment(platformAccount, campaign);

    const refs = await this.resolveOptionalRefs({
      channelId: dto.channelId,
      buyingTypeId: dto.buyingTypeId,
      formatId: dto.formatId,
      subFormatId: dto.subFormatId,
      subGroupingIds: dto.subGroupingIds,
      campaignId: campaign.id,
      platformAccount,
      objectType: dto.objectType,
    });

    this.assertLevelFields(dto.objectType, refs);

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

  async createMany(
    dto: BulkCreatePlatformObjectMapsDto,
    caller: UserSignature,
  ): Promise<PlatformObjectMapDetailDto[]> {
    this.assertSuperadmin(caller.role, 'criar mapeamentos de objetos');

    const accountIds = [
      ...new Set(dto.items.map((item) => item.platformAccountId)),
    ];

    const [campaign, accounts] = await Promise.all([
      this.campaignRepository.findOne({
        where: { id: dto.campaignId },
        relations: { client: true },
      }),
      this.platformAccountRepository.find({
        where: { id: In(accountIds) },
        relations: { client: true, platform: true },
      }),
    ]);

    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }
    if (accounts.length !== accountIds.length) {
      throw new HttpException(
        'Conta de plataforma não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    for (const account of accounts) {
      this.assertClientAlignment(account, campaign);
    }

    // Enrichment is shared by the whole batch, so resolve it once.
    const refs = await this.resolveOptionalRefs({
      channelId: dto.channelId,
      buyingTypeId: dto.buyingTypeId,
      formatId: dto.formatId,
      subFormatId: dto.subFormatId,
      subGroupingIds: dto.subGroupingIds,
      campaignId: campaign.id,
      platformAccount: accounts[0],
      objectType: dto.objectType,
    });

    // resolveOptionalRefs only checked the first account's platform.
    for (const account of accounts.slice(1)) {
      this.assertChannelPlatform(refs.channel, account);
    }

    this.assertLevelFields(dto.objectType, refs);

    const accountsById = new Map(
      accounts.map((account) => [account.id, account]),
    );

    const maps = dto.items.map((item) =>
      this.mapRepository.create({
        objectType: dto.objectType,
        externalId: item.externalId,
        externalName: item.externalName ?? null,
        isActive: dto.isActive ?? true,
        platformAccount: accountsById.get(item.platformAccountId)!,
        campaign,
        channel: refs.channel,
        buyingType: refs.buyingType,
        format: refs.format,
        subFormat: refs.subFormat,
        subGroupings: refs.subGroupings,
      }),
    );

    let saved: PlatformObjectMap[];
    try {
      saved = await this.mapRepository.save(maps);
    } catch {
      throw new HttpException(
        'Um ou mais objetos já estão mapeados para esta conta e tipo',
        HttpStatus.CONFLICT,
      );
    }

    const withRelations = await this.mapRepository.find({
      where: { id: In(saved.map((map) => map.id)) },
      relations: SUMMARY_RELATIONS,
      order: { createdAt: 'DESC' },
    });

    return withRelations.map((map) => this.toDetailDto(map));
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
        platformAccount: { client: true, platform: true },
        campaign: { client: true },
        channel: { platform: true, buyingTypes: true },
        buyingType: true,
        format: true,
        subFormat: { format: true },
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
      relations: SUMMARY_RELATIONS,
    });

    return updated.map((map) => this.toDetailDto(map));
  }

  async deleteMany(
    dto: BulkDeletePlatformObjectMapsDto,
    caller: UserSignature,
  ): Promise<void> {
    this.assertSuperadmin(caller.role, 'remover mapeamentos de objetos');

    const uniqueIds = [...new Set(dto.ids)];
    if (uniqueIds.length === 0) return;

    const maps = await this.mapRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (maps.length !== uniqueIds.length) {
      throw new HttpException(
        'Mapeamento de objeto não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.mapRepository.remove(maps);
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
        relations: { client: true },
      });
      if (!campaign) {
        throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
      }
      map.campaign = campaign;
    }

    this.assertClientAlignment(map.platformAccount, map.campaign);

    const refs = await this.resolveOptionalRefs({
      channelId: item.channelId,
      buyingTypeId: item.buyingTypeId,
      formatId: item.formatId,
      subFormatId: item.subFormatId,
      subGroupingIds: item.subGroupingIds,
      campaignId: map.campaign.id,
      platformAccount: map.platformAccount,
      objectType: map.objectType,
      patchMode: true,
      current: map,
    });

    if (item.channelId !== undefined) map.channel = refs.channel;
    if (item.buyingTypeId !== undefined) map.buyingType = refs.buyingType;
    if (item.formatId !== undefined) map.format = refs.format;
    if (item.subFormatId !== undefined) {
      map.subFormat = refs.subFormat;
      // Infer format from subFormat when only subFormat is patched
      if (item.formatId === undefined && refs.format) {
        map.format = refs.format;
      }
    }
    if (item.subGroupingIds !== undefined) map.subGroupings = refs.subGroupings;

    this.assertLevelFields(map.objectType, {
      channel: map.channel ?? null,
      buyingType: map.buyingType ?? null,
      format: map.format ?? null,
      subFormat: map.subFormat ?? null,
      subGroupings: map.subGroupings ?? [],
    });
  }

  private async resolveOptionalRefs(opts: {
    channelId?: string | null;
    buyingTypeId?: string | null;
    formatId?: string | null;
    subFormatId?: string | null;
    subGroupingIds?: string[];
    campaignId: string;
    platformAccount: PlatformAccount;
    objectType: PlatformObjectType;
    patchMode?: boolean;
    current?: PlatformObjectMap;
  }): Promise<EnrichmentRefs> {
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
          relations: { platform: true, buyingTypes: true },
        });
        if (!found) {
          throw new HttpException('Canal não encontrado', HttpStatus.NOT_FOUND);
        }
        channel = found;
      }
    } else if (channel && !channel.platform) {
      const found = await this.channelRepository.findOne({
        where: { id: channel.id },
        relations: { platform: true, buyingTypes: true },
      });
      if (found) channel = found;
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
          relations: { format: true },
        });
        if (!found) {
          throw new HttpException(
            'Subformato não encontrado',
            HttpStatus.NOT_FOUND,
          );
        }
        subFormat = found;
      }
    } else if (subFormat && !subFormat.format) {
      const found = await this.subFormatRepository.findOne({
        where: { id: subFormat.id },
        relations: { format: true },
      });
      if (found) subFormat = found;
    }

    if (opts.subGroupingIds !== undefined) {
      subGroupings = await this.loadSubGroupingsForCampaign(
        opts.subGroupingIds,
        opts.campaignId,
      );
    }

    // Infer format from subFormat when subFormat is set and format is missing
    if (subFormat && !format) {
      format = subFormat.format;
    }

    this.assertChannelPlatform(channel, opts.platformAccount);
    this.assertBuyingTypeOnChannel(channel, buyingType);
    this.assertFormatSubFormatConsistency(format, subFormat);

    return { channel, buyingType, format, subFormat, subGroupings };
  }

  private assertClientAlignment(
    platformAccount: PlatformAccount,
    campaign: Campaign,
  ): void {
    if (campaign.client.id !== platformAccount.client.id) {
      throw new HttpException(
        'Campanha não pertence ao cliente da conta de plataforma',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertChannelPlatform(
    channel: Channel | null,
    platformAccount: PlatformAccount,
  ): void {
    if (!channel) return;
    if (channel.platform.id !== platformAccount.platform.id) {
      throw new HttpException(
        'Canal não pertence à plataforma da conta',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertBuyingTypeOnChannel(
    channel: Channel | null,
    buyingType: BuyingType | null,
  ): void {
    if (!channel || !buyingType) return;
    const allowed = (channel.buyingTypes ?? []).some(
      (bt) => bt.id === buyingType.id,
    );
    if (!allowed) {
      throw new HttpException(
        'Tipo de compra não é válido para o canal selecionado',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertFormatSubFormatConsistency(
    format: Format | null,
    subFormat: SubFormat | null,
  ): void {
    if (!format || !subFormat) return;
    if (subFormat.format.id !== format.id) {
      throw new HttpException(
        'Subformato não pertence ao formato selecionado',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertLevelFields(
    objectType: PlatformObjectType,
    refs: EnrichmentRefs,
  ): void {
    const hasChannel = refs.channel != null;
    const hasBuyingType = refs.buyingType != null;
    const hasFormat = refs.format != null;
    const hasSubFormat = refs.subFormat != null;
    const hasSubGroupings = refs.subGroupings.length > 0;

    switch (objectType) {
      case PlatformObjectType.Campaign:
        if (hasFormat || hasSubFormat || hasSubGroupings) {
          throw new HttpException(
            'Mapeamento de campanha não aceita formato, subformato ou subagrupamentos',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!hasChannel || !hasBuyingType) {
          throw new HttpException(
            'Mapeamento de campanha exige canal e tipo de compra',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case PlatformObjectType.AdGroup:
        if (hasChannel || hasBuyingType || hasFormat || hasSubFormat) {
          throw new HttpException(
            'Mapeamento de ad group aceita apenas subagrupamentos',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case PlatformObjectType.Ad:
        if (hasChannel || hasBuyingType || hasSubGroupings) {
          throw new HttpException(
            'Mapeamento de ad aceita apenas formato e subformato',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
    }
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
      relations: SUMMARY_RELATIONS,
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
      externalAccountId: map.platformAccount.externalAccountId,
      accountName: map.platformAccount.name,
      platformId: map.platformAccount.platform.id,
      platformName: map.platformAccount.platform.name,
      clientId: map.platformAccount.client.id,
      clientName: map.platformAccount.client.name,
      campaignId: map.campaign.id,
      campaignName: map.campaign.name,
      channelId: map.channel?.id ?? null,
      channelName: map.channel?.name ?? null,
      buyingTypeId: map.buyingType?.id ?? null,
      buyingTypeName: map.buyingType?.name ?? null,
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
