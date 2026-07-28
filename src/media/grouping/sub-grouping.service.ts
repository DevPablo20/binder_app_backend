import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SubGrouping } from './sub-grouping.entity';
import { Grouping } from './grouping.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import { hasMinRole } from 'src/shared/role.util';
import {
  BulkUpdateSubGroupingsDto,
  CreateSubGroupingsDto,
  SubGroupingDetailDto,
  SubGroupingSummaryDto,
} from './sub-grouping.dto';

@Injectable()
export class SubGroupingService {
  constructor(
    @InjectRepository(SubGrouping)
    private readonly subGroupingRepository: Repository<SubGrouping>,
    @InjectRepository(Grouping)
    private readonly groupingRepository: Repository<Grouping>,
  ) {}

  async findAll(caller: UserSignature): Promise<SubGroupingSummaryDto[]> {
    const qb = this.subGroupingRepository
      .createQueryBuilder('subGrouping')
      .innerJoinAndSelect('subGrouping.grouping', 'grouping')
      .orderBy('subGrouping.name', 'ASC');

    if (caller.role !== Role.Superadmin) {
      if (caller.companyIds.length === 0) {
        return [];
      }
      qb.innerJoin('grouping.campaign', 'campaign')
        .innerJoin('campaign.client', 'client')
        .andWhere('client.company_id IN (:...companyIds)', {
          companyIds: caller.companyIds,
        });
    }

    const subGroupings = await qb.getMany();
    return subGroupings.map((subGrouping) => this.toSummaryDto(subGrouping));
  }

  async findOne(
    id: string,
    caller: UserSignature,
  ): Promise<SubGroupingDetailDto> {
    const subGrouping = await this.subGroupingRepository.findOne({
      where: { id },
      relations: {
        grouping: { campaign: { client: { company: true } } },
      },
    });

    if (!subGrouping) {
      throw new HttpException(
        'Sub-agrupamento não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (caller.role !== Role.Superadmin) {
      this.assertCompanyAccess(
        subGrouping.grouping.campaign.client.company.id,
        caller,
      );
    }

    return this.toDetailDto(subGrouping);
  }

  async createMany(
    dto: CreateSubGroupingsDto,
    caller: UserSignature,
  ): Promise<SubGroupingDetailDto[]> {
    this.assertMinRole(caller.role, Role.Editor, 'criar sub-agrupamentos');

    const names = dto.subGroupings.map((item) => item.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      throw new HttpException(
        'Nomes de sub-agrupamento duplicados na requisição',
        HttpStatus.CONFLICT,
      );
    }

    const grouping = await this.groupingRepository.findOne({
      where: { id: dto.groupingId },
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

    const subGroupings = dto.subGroupings.map((item) =>
      this.subGroupingRepository.create({
        name: item.name,
        description: item.description,
        isActive: item.isActive ?? true,
        grouping,
      }),
    );

    try {
      const saved = await this.subGroupingRepository.manager.transaction(
        async (manager) => manager.save(SubGrouping, subGroupings),
      );

      return saved.map((subGrouping) => this.toDetailDto(subGrouping));
    } catch {
      throw new HttpException(
        'Nome de sub-agrupamento já existe para este agrupamento',
        HttpStatus.CONFLICT,
      );
    }
  }

  async updateMany(
    dto: BulkUpdateSubGroupingsDto,
    caller: UserSignature,
  ): Promise<SubGroupingDetailDto[]> {
    this.assertMinRole(caller.role, Role.Editor, 'editar sub-agrupamentos');

    const ids = dto.subGroupings.map((item) => item.id);
    const subGroupings = await this.subGroupingRepository.find({
      where: { id: In(ids) },
      relations: {
        grouping: { campaign: { client: { company: true } } },
      },
    });

    if (subGroupings.length !== ids.length) {
      throw new HttpException(
        'Sub-agrupamento não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (caller.role !== Role.Superadmin) {
      for (const subGrouping of subGroupings) {
        this.assertCompanyAccess(
          subGrouping.grouping.campaign.client.company.id,
          caller,
        );
      }
    }

    const subGroupingsById = new Map(
      subGroupings.map((subGrouping) => [subGrouping.id, subGrouping]),
    );

    for (const item of dto.subGroupings) {
      const subGrouping = subGroupingsById.get(item.id)!;
      if (item.name !== undefined) subGrouping.name = item.name;
      if (item.description !== undefined)
        subGrouping.description = item.description;
      if (item.isActive !== undefined) subGrouping.isActive = item.isActive;
    }

    try {
      const updated = await this.subGroupingRepository.manager.transaction(
        async (manager) =>
          manager.save(SubGrouping, [...subGroupingsById.values()]),
      );

      return updated.map((subGrouping) => this.toDetailDto(subGrouping));
    } catch {
      throw new HttpException(
        'Nome de sub-agrupamento já existe para este agrupamento',
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

  private toSummaryDto(subGrouping: SubGrouping): SubGroupingSummaryDto {
    return {
      id: subGrouping.id,
      name: subGrouping.name,
      isActive: subGrouping.isActive,
      groupingId: subGrouping.grouping.id,
    };
  }

  private toDetailDto(subGrouping: SubGrouping): SubGroupingDetailDto {
    return {
      ...this.toSummaryDto(subGrouping),
      description: subGrouping.description,
      createdAt: subGrouping.createdAt,
      updatedAt: subGrouping.updatedAt,
    };
  }
}
