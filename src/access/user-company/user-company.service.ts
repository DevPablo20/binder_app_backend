import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserCompany } from './user-company.entity';
import { User } from 'src/access/user/user.entity';
import { Company } from 'src/access/company/company.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  CompanyWithMembershipDto,
  UserCompanyMembershipDto,
} from './user-company.dto';
import { UserWithCompaniesDto } from 'src/access/user/user.dto';

@Injectable()
export class UserCompanyService {
  constructor(
    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async revokeById(
    userCompanyId: string,
    caller: UserSignature,
  ): Promise<UserCompanyMembershipDto> {
    this.assertSuperadmin(caller, 'revogar acesso de usuário');

    const membership = await this.userCompanyRepository.findOne({
      where: { id: userCompanyId },
      relations: { user: true, company: true },
    });

    if (!membership) {
      throw new HttpException(
        'Vínculo usuário-empresa não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (membership.user.id === caller.id) {
      throw new HttpException(
        'Não é permitido revogar o próprio acesso',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!membership.isActive) {
      return this.toMembershipDto(membership);
    }

    membership.isActive = false;
    await this.userCompanyRepository.save(membership);

    return this.toMembershipDto(membership);
  }

  async syncMemberships(
    userId: string,
    companyIds: string[],
    caller: UserSignature,
  ): Promise<UserWithCompaniesDto> {
    this.assertSuperadmin(caller, 'gerenciar vínculos usuário-empresa');
    this.assertNotSelfTarget(userId, caller);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { userCompanies: { company: true } },
    });

    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    const uniqueCompanyIds = [...new Set(companyIds)];
    await this.validateCompaniesExist(uniqueCompanyIds);

    const activeByCompanyId = new Map(
      (user.userCompanies ?? [])
        .filter((uc) => uc.company)
        .map((uc) => [uc.company.id, uc]),
    );

    const toGrant = uniqueCompanyIds.filter(
      (companyId) => !activeByCompanyId.get(companyId)?.isActive,
    );
    const companyIdSet = new Set(uniqueCompanyIds);
    const toRevoke = (user.userCompanies ?? []).filter(
      (uc) => uc.isActive && uc.company && !companyIdSet.has(uc.company.id),
    );

    await this.userCompanyRepository.manager.transaction(async (manager) => {
      for (const companyId of toGrant) {
        const existing = activeByCompanyId.get(companyId);
        if (existing) {
          existing.isActive = true;
          await manager.save(UserCompany, existing);
        } else {
          await manager.save(
            UserCompany,
            manager.create(UserCompany, {
              user: { id: userId },
              company: { id: companyId },
              isActive: true,
            }),
          );
        }
      }

      for (const membership of toRevoke) {
        membership.isActive = false;
        await manager.save(UserCompany, membership);
      }
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: { userCompanies: { company: true } },
    });

    if (!updatedUser) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    return this.toWithCompaniesDto(updatedUser);
  }

  private assertSuperadmin(caller: UserSignature, action: string): void {
    if (caller.role !== Role.Superadmin) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertNotSelfTarget(userId: string, caller: UserSignature): void {
    if (caller.id === userId) {
      throw new HttpException(
        'Não é permitido alterar os próprios vínculos',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async validateCompaniesExist(companyIds: string[]): Promise<void> {
    if (companyIds.length === 0) {
      return;
    }

    const companies = await this.companyRepository.find({
      where: { id: In(companyIds) },
    });

    if (companies.length !== companyIds.length) {
      throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
    }
  }

  private toMembershipDto(membership: UserCompany): UserCompanyMembershipDto {
    return {
      id: membership.id,
      userId: membership.user.id,
      companyId: membership.company.id,
      isActive: membership.isActive,
    };
  }

  private toWithCompaniesDto(user: User): UserWithCompaniesDto {
    const companies: CompanyWithMembershipDto[] = (user.userCompanies ?? [])
      .filter((uc) => uc.isActive && uc.company)
      .map((uc) => ({
        id: uc.company.id,
        membershipId: uc.id,
        name: uc.company.name,
        isActive: uc.company.isActive,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      companies,
    };
  }
}
