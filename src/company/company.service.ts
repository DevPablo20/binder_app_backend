import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Company } from './company.entity';
import { UserCompany } from 'src/user-company/user-company.entity';
import { UserSignature } from 'src/auth/userSignature.type';
import { Role } from 'src/common/role.enum';
import { hasMinRole } from 'src/common/role.util';
import {
  CompanyDetailDto,
  CompanySummaryDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './company.dto';
import { UserSummaryDto } from 'src/user/user.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,
  ) {}

  async findAll(caller: UserSignature): Promise<CompanySummaryDto[]> {
    if (caller.companyIds.length === 0) {
      return [];
    }

    const companies = await this.companyRepository.find({
      where: { id: In(caller.companyIds), status: true },
      order: { name: 'ASC' },
    });

    return companies.map((company) => this.toSummaryDto(company));
  }

  async findAllForAdmin(caller: UserSignature): Promise<CompanyDetailDto[]> {
    this.assertSuperadmin(caller.role, 'listar todas as empresas');

    const companies = await this.companyRepository.find({
      order: { name: 'ASC' },
    });

    return companies.map((company) => this.toDetailDto(company));
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
      status: dto.status ?? true,
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
        status: true,
      }),
    );

    return this.toDetailDto(company);
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    caller: UserSignature,
  ): Promise<CompanyDetailDto> {
    this.assertSuperadmin(caller.role, 'editar empresas');

    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
    }

    if (dto.name !== undefined) company.name = dto.name;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.status !== undefined) company.status = dto.status;

    try {
      await this.companyRepository.save(company);
    } catch {
      throw new HttpException('Nome de empresa já existe', HttpStatus.CONFLICT);
    }

    return this.toDetailDto(company);
  }

  async findUsersByCompany(
    companyId: string,
    caller: UserSignature,
  ): Promise<UserSummaryDto[]> {
    this.assertMinRole(caller.role, Role.Editor, 'listar usuários da empresa');
    this.assertCompanyAccess(companyId, caller);

    const memberships = await this.userCompanyRepository.find({
      where: {
        company: { id: companyId },
        status: true,
      },
      relations: { user: true },
      order: { user: { name: 'ASC' } },
    });

    return memberships
      .filter((uc) => uc.user?.isActive)
      .map((uc) => ({
        id: uc.user.id,
        name: uc.user.name,
        email: uc.user.email,
        role: uc.user.role,
        isActive: uc.user.isActive,
      }));
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

  private toSummaryDto(company: Company): CompanySummaryDto {
    return {
      id: company.id,
      name: company.name,
      status: company.status,
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
}
