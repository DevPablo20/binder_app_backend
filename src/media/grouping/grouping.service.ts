import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Grouping } from './grouping.entity';
import { Campaign } from 'src/business/campaign/campaign.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import { hasMinRole } from 'src/shared/role.util';
import {
  BulkUpdateGroupingsDto,
  CreateGroupingDto,
  GroupingDetailDto,
  GroupingSummaryDto,
} from './grouping.dto';

@Injectable()
export class GroupingService {
  constructor(
    @InjectRepository(Grouping)
    private readonly groupingRepository: Repository<Grouping>,
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async findAll(caller: UserSignature): Promise<GroupingSummaryDto[]> {
    this.assertMinRole(caller.role, Role.Editor, 'listar agrupamentos');

    const qb = this.groupingRepository
      .createQueryBuilder('grouping')
      .innerJoinAndSelect('grouping.campaign', 'campaign')
      .orderBy('grouping.name', 'ASC');

    if (caller.role !== Role.Superadmin) {
      if (caller.companyIds.length === 0) {
        return [];
      }
      qb.innerJoin('campaign.client', 'client').andWhere(
        'client.company_id IN (:...companyIds)',
        { companyIds: caller.companyIds },
      );
    }

    const groupings = await qb.getMany();
    return groupings.map((grouping) => this.toSummaryDto(grouping));
  }

  async findOne(id: string, caller: UserSignature): Promise<GroupingDetailDto> {
    this.assertMinRole(caller.role, Role.Editor, 'consultar agrupamento');

    const grouping = await this.groupingRepository.findOne({
      where: { id },
      relations: { campaign: { client: { company: true } } },
    });

    if (!grouping) {
      throw new HttpException(
        'Agrupamento não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (caller.role !== Role.Superadmin) {
      this.assertCompanyAccess(grouping.campaign.client.company.id, caller);
    }

    return this.toDetailDto(grouping);
  }

  async create(
    dto: CreateGroupingDto,
    caller: UserSignature,
  ): Promise<GroupingDetailDto> {
    this.assertMinRole(caller.role, Role.Editor, 'criar agrupamentos');

    const campaign = await this.campaignRepository.findOne({
      where: { id: dto.campaignId },
      relations: { client: { company: true } },
    });

    if (!campaign) {
      throw new HttpException('Campanha não encontrada', HttpStatus.NOT_FOUND);
    }

    if (caller.role !== Role.Superadmin) {
      this.assertCompanyAccess(campaign.client.company.id, caller);
    }

    const grouping = this.groupingRepository.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
      campaign,
    });

    try {
      await this.groupingRepository.save(grouping);
    } catch {
      throw new HttpException(
        'Nome de agrupamento já existe para esta campanha',
        HttpStatus.CONFLICT,
      );
    }

    return this.toDetailDto(grouping);
  }

  async updateMany(
    dto: BulkUpdateGroupingsDto,
    caller: UserSignature,
  ): Promise<GroupingDetailDto[]> {
    this.assertMinRole(caller.role, Role.Editor, 'editar agrupamentos');

    const ids = dto.groupings.map((item) => item.id);
    const groupings = await this.groupingRepository.find({
      where: { id: In(ids) },
      relations: { campaign: { client: { company: true } } },
    });

    if (groupings.length !== ids.length) {
      throw new HttpException(
        'Agrupamento não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (caller.role !== Role.Superadmin) {
      for (const grouping of groupings) {
        this.assertCompanyAccess(grouping.campaign.client.company.id, caller);
      }
    }

    const groupingsById = new Map(
      groupings.map((grouping) => [grouping.id, grouping]),
    );

    for (const item of dto.groupings) {
      const grouping = groupingsById.get(item.id)!;
      if (item.name !== undefined) grouping.name = item.name;
      if (item.description !== undefined)
        grouping.description = item.description;
      if (item.isActive !== undefined) grouping.isActive = item.isActive;
    }

    try {
      const updated = await this.groupingRepository.manager.transaction(
        async (manager) => manager.save(Grouping, [...groupingsById.values()]),
      );

      return updated.map((grouping) => this.toDetailDto(grouping));
    } catch {
      throw new HttpException(
        'Nome de agrupamento já existe para esta campanha',
        HttpStatus.CONFLICT,
      );
    }
  }

  private assertCompanyAccess(companyId: string, caller: UserSignature): void {
    if (!caller.companyIds.includes(companyId)) {
      throw new HttpException(
        'Sem permissão para acessar esta empresa',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertMinRole(userRole: Role, minRole: Role, action: string): void {
    if (!hasMinRole(userRole, minRole)) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toSummaryDto(grouping: Grouping): GroupingSummaryDto {
    return {
      id: grouping.id,
      name: grouping.name,
      isActive: grouping.isActive,
      campaignId: grouping.campaign.id,
    };
  }

  private toDetailDto(grouping: Grouping): GroupingDetailDto {
    return {
      ...this.toSummaryDto(grouping),
      description: grouping.description,
      createdAt: grouping.createdAt,
      updatedAt: grouping.updatedAt,
    };
  }
}
