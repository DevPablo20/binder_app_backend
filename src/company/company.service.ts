import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Company } from './company.entity';
import { UserCompany } from 'src/user-company/user-company.entity';
import { UserSignature } from 'src/auth/userSignature.type';
import { Role } from 'src/common/role.enum';
import { hasMinRole } from 'src/common/role.util';
import {
  BulkUpdateCompaniesDto,
  CompanyDetailDto,
  CompanySummaryDto,
  CompanyWithUsersDto,
  CreateCompanyDto,
} from './company.dto';
import { UserWithMembershipDto } from 'src/user-company/user-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,
  ) {}

  async findMe(caller: UserSignature): Promise<CompanySummaryDto[]> {
    const memberships = await this.userCompanyRepository.find({
      where: {
        user: { id: caller.id },
        isActive: true,
        company: { isActive: true },
      },
      relations: { company: true },
      order: { company: { name: 'ASC' } },
    });

    return memberships.map((membership) =>
      this.toSummaryDto(membership.company),
    );
  }

  async findAll(
    caller: UserSignature,
  ): Promise<CompanySummaryDto[] | CompanyWithUsersDto[]> {
    if (caller.role === Role.Viewer) {
      return this.findMe(caller);
    }

    if (caller.role === Role.Superadmin) {
      const companies = await this.companyRepository.find({
        relations: { userCompanies: { user: true } },
        order: { name: 'ASC' },
      });

      return companies.map((company) => this.toDetailWithUsersDto(company));
    }

    if (caller.companyIds.length === 0) {
      return [];
    }

    const companies = await this.companyRepository.find({
      where: { id: In(caller.companyIds) },
      relations: { userCompanies: { user: true } },
      order: { name: 'ASC' },
    });

    return companies.map((company) => this.toDetailWithUsersDto(company));
  }

  async findOne(id: string, caller: UserSignature): Promise<CompanyDetailDto> {
    if (caller.role !== Role.Superadmin) {
      this.assertCompanyAccess(id, caller);
    }

    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
    }

    return this.toDetailDto(company);
  }

  async create(
    dto: CreateCompanyDto,
    caller: UserSignature,
  ): Promise<CompanyDetailDto> {
    this.assertSuperadmin(caller.role, 'criar empresas');

    const company = this.companyRepository.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    try {
      await this.companyRepository.save(company);
    } catch {
      throw new HttpException('Nome de empresa já existe', HttpStatus.CONFLICT);
    }

    await this.userCompanyRepository.save(
      this.userCompanyRepository.create({
        user: { id: caller.id },
        company,
        isActive: true,
      }),
    );

    return this.toDetailDto(company);
  }

  async updateMany(
    dto: BulkUpdateCompaniesDto,
    caller: UserSignature,
  ): Promise<CompanyDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar empresas');

    const ids = dto.companies.map((item) => item.id);
    const companies = await this.companyRepository.find({
      where: { id: In(ids) },
    });

    if (companies.length !== ids.length) {
      throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
    }

    const companiesById = new Map(
      companies.map((company) => [company.id, company]),
    );

    for (const item of dto.companies) {
      const company = companiesById.get(item.id)!;
      if (item.name !== undefined) company.name = item.name;
      if (item.description !== undefined)
        company.description = item.description;
      if (item.isActive !== undefined) company.isActive = item.isActive;
    }

    try {
      const updated = await this.companyRepository.manager.transaction(
        async (manager) => manager.save(Company, [...companiesById.values()]),
      );

      return updated.map((company) => this.toDetailDto(company));
    } catch {
      throw new HttpException('Nome de empresa já existe', HttpStatus.CONFLICT);
    }
  }

  async findUsersByCompany(
    companyId: string,
    caller: UserSignature,
  ): Promise<UserWithMembershipDto[]> {
    this.assertMinRole(caller.role, Role.Editor, 'listar usuários da empresa');
    this.assertCompanyAccess(companyId, caller);

    const memberships = await this.userCompanyRepository.find({
      where: {
        company: { id: companyId },
        isActive: true,
      },
      relations: { user: true },
      order: { user: { name: 'ASC' } },
    });

    return this.mapActiveUsers(memberships);
  }

  private assertCompanyAccess(companyId: string, caller: UserSignature): void {
    if (!caller.companyIds.includes(companyId)) {
      throw new HttpException(
        'Sem permissão para acessar esta empresa',
        HttpStatus.FORBIDDEN,
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

  private assertMinRole(userRole: Role, minRole: Role, action: string): void {
    if (!hasMinRole(userRole, minRole)) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private mapActiveUsers(
    userCompanies: UserCompany[],
  ): UserWithMembershipDto[] {
    return userCompanies
      .filter((uc) => uc.isActive && uc.user?.isActive)
      .map((uc) => ({
        id: uc.user.id,
        membershipId: uc.id,
        name: uc.user.name,
        email: uc.user.email,
        role: uc.user.role,
        isActive: uc.user.isActive,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private toSummaryDto(company: Company): CompanySummaryDto {
    return {
      id: company.id,
      name: company.name,
      isActive: company.isActive,
    };
  }

  private toDetailDto(company: Company): CompanyDetailDto {
    return {
      ...this.toSummaryDto(company),
      description: company.description,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  private toDetailWithUsersDto(company: Company): CompanyWithUsersDto {
    return {
      ...this.toDetailDto(company),
      users: this.mapActiveUsers(company.userCompanies ?? []),
    };
  }
}
