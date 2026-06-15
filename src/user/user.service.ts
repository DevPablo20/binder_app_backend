import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { UserCompany } from 'src/user-company/user-company.entity';
import { UserSignature } from 'src/auth/userSignature.type';
import { Role } from 'src/common/role.enum';
import { hasMinRole } from 'src/common/role.util';
import {
  MeResponseDto,
  RevokeUserCompanyResponseDto,
  UserDetailDto,
  UserSummaryDto,
} from './user.dto';
import { CompanySummaryDto } from 'src/company/company.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,
  ) {}

  async getMe(caller: UserSignature): Promise<MeResponseDto> {
    const user = await this.findUserWithCompanies(caller.id);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }
    return this.toDetailDto(user, new Set(caller.companyIds));
  }

  async findAll(caller: UserSignature): Promise<UserSummaryDto[]> {
    this.assertMinRole(caller.role, Role.Editor, 'listar usuários');

    if (caller.companyIds.length === 0) {
      return [];
    }

    const memberships = await this.userCompanyRepository.find({
      where: {
        company: { id: In(caller.companyIds) },
        status: true,
      },
      relations: { user: true },
    });

    const usersById = new Map<string, User>();
    for (const membership of memberships) {
      if (membership.user?.isActive) {
        usersById.set(membership.user.id, membership.user);
      }
    }

    return [...usersById.values()].map((user) => this.toSummaryDto(user));
  }

  async findOne(id: string, caller: UserSignature): Promise<UserDetailDto> {
    if (caller.id === id) {
      return this.getMe(caller);
    }

    const user = await this.findUserWithCompanies(id);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    const callerCompanyIds = new Set(caller.companyIds);
    if (!this.hasSharedCompany(user, callerCompanyIds)) {
      throw new HttpException(
        'Sem permissão para visualizar este usuário',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.toDetailDto(user, callerCompanyIds);
  }

  async revokeCompanyAccess(
    userId: string,
    companyId: string,
    caller: UserSignature,
  ): Promise<RevokeUserCompanyResponseDto> {
    this.assertMinRole(caller.role, Role.Editor, 'revogar acesso de usuário');

    if (caller.id === userId) {
      throw new HttpException(
        'Não é permitido revogar o próprio acesso',
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      caller.role !== Role.Superadmin &&
      !caller.companyIds.includes(companyId)
    ) {
      throw new HttpException(
        'Sem permissão para revogar acesso nesta empresa',
        HttpStatus.FORBIDDEN,
      );
    }

    const membership = await this.userCompanyRepository.findOne({
      where: {
        user: { id: userId },
        company: { id: companyId },
      },
    });

    if (!membership) {
      throw new HttpException(
        'Vínculo usuário-empresa não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!membership.status) {
      return { userId, companyId, status: false };
    }

    membership.status = false;
    await this.userCompanyRepository.save(membership);

    return { userId, companyId, status: false };
  }

  private async findUserWithCompanies(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { userCompanies: { company: true } },
    });
  }

  private hasSharedCompany(user: User, callerCompanyIds: Set<string>): boolean {
    return (
      user.userCompanies?.some(
        (uc) =>
          uc.status &&
          uc.company?.isActive &&
          callerCompanyIds.has(uc.company.id),
      ) ?? false
    );
  }

  private assertMinRole(userRole: Role, minRole: Role, action: string): void {
    if (!hasMinRole(userRole, minRole)) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toSummaryDto(user: User): UserSummaryDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }

  private toDetailDto(
    user: User,
    visibleCompanyIds: Set<string>,
  ): UserDetailDto {
    const companies: CompanySummaryDto[] =
      user.userCompanies
        ?.filter(
          (uc) =>
            uc.status &&
            uc.company?.isActive &&
            visibleCompanyIds.has(uc.company.id),
        )
        .map((uc) => ({
          id: uc.company.id,
          name: uc.company.name,
          isActive: uc.company.isActive,
        })) ?? [];

    return {
      ...this.toSummaryDto(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      companies,
    };
  }
}
