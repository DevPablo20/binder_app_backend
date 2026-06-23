import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { Client } from 'src/client/client.entity';
import { UserSignature } from 'src/auth/userSignature.type';
import { Role } from 'src/common/role.enum';
import {
  BulkUpdateCampaignsDto,
  CampaignDetailDto,
  CampaignSummaryDto,
  CreateCampaignDto,
} from './campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async findAll(caller: UserSignature): Promise<CampaignSummaryDto[]> {
    this.assertSuperadmin(caller.role, 'listar campanhas');

    const campaigns = await this.campaignRepository.find({
      relations: { client: true },
      order: { name: 'ASC' },
    });

    return campaigns.map((campaign) => this.toSummaryDto(campaign));
  }

  async findOne(id: string, caller: UserSignature): Promise<CampaignDetailDto> {
    this.assertSuperadmin(caller.role, 'consultar campanha');

    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: { client: true },
    });

    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    return this.toDetailDto(campaign);
  }

  async create(
    dto: CreateCampaignDto,
    caller: UserSignature,
  ): Promise<CampaignDetailDto> {
    this.assertSuperadmin(caller.role, 'criar campanhas');

    const client = await this.clientRepository.findOne({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
    }

    const campaign = this.campaignRepository.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
      client,
    });

    try {
      await this.campaignRepository.save(campaign);
    } catch {
      throw new HttpException(
        'Nome de campanha já existe para este cliente',
        HttpStatus.CONFLICT,
      );
    }

    return this.toDetailDto(campaign);
  }

  async updateMany(
    dto: BulkUpdateCampaignsDto,
    caller: UserSignature,
  ): Promise<CampaignDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar campanhas');

    const ids = dto.campaigns.map((item) => item.id);
    const campaigns = await this.campaignRepository.find({
      where: { id: In(ids) },
      relations: { client: true },
    });

    if (campaigns.length !== ids.length) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    const campaignsById = new Map(
      campaigns.map((campaign) => [campaign.id, campaign]),
    );

    for (const item of dto.campaigns) {
      const campaign = campaignsById.get(item.id)!;
      if (item.name !== undefined) campaign.name = item.name;
      if (item.description !== undefined)
        campaign.description = item.description;
      if (item.isActive !== undefined) campaign.isActive = item.isActive;
    }

    try {
      const updated = await this.campaignRepository.manager.transaction(
        async (manager) => manager.save(Campaign, [...campaignsById.values()]),
      );

      return updated.map((campaign) => this.toDetailDto(campaign));
    } catch {
      throw new HttpException(
        'Nome de campanha já existe para este cliente',
        HttpStatus.CONFLICT,
      );
    }
  }

  private assertSuperadmin(userRole: Role, action: string): void {
    if (userRole !== Role.Superadmin) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toSummaryDto(campaign: Campaign): CampaignSummaryDto {
    return {
      id: campaign.id,
      name: campaign.name,
      isActive: campaign.isActive,
      clientId: campaign.client.id,
    };
  }

  private toDetailDto(campaign: Campaign): CampaignDetailDto {
    return {
      ...this.toSummaryDto(campaign),
      description: campaign.description,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }
}
