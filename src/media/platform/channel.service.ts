import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Channel } from './channel.entity';
import { Platform } from './platform.entity';
import { BuyingType } from './buying-type.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateChannelsDto,
  ChannelDetailDto,
  ChannelSummaryDto,
  CreateChannelsDto,
} from './channel.dto';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
    @InjectRepository(BuyingType)
    private readonly buyingTypeRepository: Repository<BuyingType>,
  ) {}

  async findAll(): Promise<ChannelSummaryDto[]> {
    const channels = await this.channelRepository.find({
      relations: { platform: true },
      order: { name: 'ASC' },
    });

    return channels.map((channel) => this.toSummaryDto(channel));
  }

  async findOne(id: string): Promise<ChannelDetailDto> {
    const channel = await this.channelRepository.findOne({
      where: { id },
      relations: { platform: true, buyingTypes: true },
    });

    if (!channel) {
      throw new HttpException('Canal não encontrado', HttpStatus.NOT_FOUND);
    }

    return this.toDetailDto(channel);
  }

  async createMany(
    dto: CreateChannelsDto,
    caller: UserSignature,
  ): Promise<ChannelDetailDto[]> {
    this.assertSuperadmin(caller.role, 'criar canais');

    const names = dto.channels.map((item) => item.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      throw new HttpException(
        'Nomes de canal duplicados na requisição',
        HttpStatus.CONFLICT,
      );
    }

    const platform = await this.platformRepository.findOne({
      where: { id: dto.platformId },
    });

    if (!platform) {
      throw new HttpException('Plataforma não encontrada', HttpStatus.NOT_FOUND);
    }

    const allBuyingTypeIds = [
      ...new Set(
        dto.channels.flatMap((item) => item.buyingTypeIds ?? []),
      ),
    ];

    const buyingTypesById = await this.loadBuyingTypesById(allBuyingTypeIds);

    const channels = dto.channels.map((item) =>
      this.channelRepository.create({
        name: item.name,
        description: item.description,
        isActive: item.isActive ?? true,
        platform,
        buyingTypes: (item.buyingTypeIds ?? []).map(
          (id) => buyingTypesById.get(id)!,
        ),
      }),
    );

    try {
      const saved = await this.channelRepository.manager.transaction(
        async (manager) => manager.save(Channel, channels),
      );

      const withRelations = await this.channelRepository.find({
        where: { id: In(saved.map((c) => c.id)) },
        relations: { platform: true, buyingTypes: true },
      });

      return withRelations.map((channel) => this.toDetailDto(channel));
    } catch {
      throw new HttpException(
        'Nome de canal já existe para esta plataforma',
        HttpStatus.CONFLICT,
      );
    }
  }

  async updateMany(
    dto: BulkUpdateChannelsDto,
    caller: UserSignature,
  ): Promise<ChannelDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar canais');

    const ids = dto.channels.map((item) => item.id);
    const channels = await this.channelRepository.find({
      where: { id: In(ids) },
      relations: { platform: true, buyingTypes: true },
    });

    if (channels.length !== ids.length) {
      throw new HttpException('Canal não encontrado', HttpStatus.NOT_FOUND);
    }

    const channelsById = new Map(
      channels.map((channel) => [channel.id, channel]),
    );

    const allBuyingTypeIds = [
      ...new Set(
        dto.channels.flatMap((item) => item.buyingTypeIds ?? []),
      ),
    ];

    const buyingTypesById =
      allBuyingTypeIds.length > 0
        ? await this.loadBuyingTypesById(allBuyingTypeIds)
        : new Map<string, BuyingType>();

    for (const item of dto.channels) {
      const channel = channelsById.get(item.id)!;
      if (item.name !== undefined) channel.name = item.name;
      if (item.description !== undefined) channel.description = item.description;
      if (item.isActive !== undefined) channel.isActive = item.isActive;
      if (item.buyingTypeIds !== undefined) {
        channel.buyingTypes = item.buyingTypeIds.map(
          (id) => buyingTypesById.get(id)!,
        );
      }
    }

    try {
      const updated = await this.channelRepository.manager.transaction(
        async (manager) => manager.save(Channel, [...channelsById.values()]),
      );

      const withRelations = await this.channelRepository.find({
        where: { id: In(updated.map((c) => c.id)) },
        relations: { platform: true, buyingTypes: true },
      });

      return withRelations.map((channel) => this.toDetailDto(channel));
    } catch {
      throw new HttpException(
        'Nome de canal já existe para esta plataforma',
        HttpStatus.CONFLICT,
      );
    }
  }

  private async loadBuyingTypesById(
    ids: string[],
  ): Promise<Map<string, BuyingType>> {
    if (ids.length === 0) {
      return new Map();
    }

    const buyingTypes = await this.buyingTypeRepository.find({
      where: { id: In(ids) },
    });

    if (buyingTypes.length !== ids.length) {
      throw new HttpException(
        'Tipo de compra não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    return new Map(buyingTypes.map((bt) => [bt.id, bt]));
  }

  private assertSuperadmin(userRole: Role, action: string): void {
    if (userRole !== Role.Superadmin) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toSummaryDto(channel: Channel): ChannelSummaryDto {
    return {
      id: channel.id,
      name: channel.name,
      isActive: channel.isActive,
      platformId: channel.platform.id,
    };
  }

  private toDetailDto(channel: Channel): ChannelDetailDto {
    return {
      ...this.toSummaryDto(channel),
      description: channel.description,
      buyingTypeIds: channel.buyingTypes?.map((bt) => bt.id) ?? [],
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}
