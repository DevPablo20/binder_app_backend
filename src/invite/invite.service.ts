import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { hash } from 'bcrypt';
import { Invite } from './invite.entity';
import { Company } from 'src/company/company.entity';
import { User } from 'src/user/user.entity';
import { UserCompany } from 'src/user-company/user-company.entity';
import { UserSignature } from 'src/auth/userSignature.type';
import { Role } from 'src/common/role.enum';
import { InviteStatus } from 'src/common/invite-status.enum';
import { hasMinRole } from 'src/common/role.util';
import { MailService } from 'src/mail/mail.service';
import {
  AcceptInviteDto,
  CreateInviteDto,
  InviteDetailDto,
  InviteMessageResponseDto,
  InvitePublicDetailsDto,
  InviteSummaryDto,
  RefuseInviteDto,
} from './invite.dto';
import { CompanySummaryDto } from 'src/company/company.dto';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,
    private readonly mailService: MailService,
  ) {}

  async create(
    dto: CreateInviteDto,
    caller: UserSignature,
  ): Promise<InviteDetailDto> {
    this.assertCanInvite(caller.role);
    this.assertAssignableRole(caller.role, dto.role);

    const email = dto.email.toLowerCase();
    const companies = await this.resolveCompanies(dto.companyIds, caller);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new HttpException(
        'Já existe usuário com este email. Convites são apenas para novos usuários',
        HttpStatus.FORBIDDEN,
      );
    }

    const pendingInvite = await this.inviteRepository.findOne({
      where: { email, status: InviteStatus.Pending },
    });
    if (pendingInvite) {
      throw new HttpException(
        'Já existe convite pendente para este email',
        HttpStatus.CONFLICT,
      );
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    const invite = this.inviteRepository.create({
      email,
      token,
      role: dto.role,
      status: InviteStatus.Pending,
      expiresAt,
      invitedBy: { id: caller.id } as User,
      companies,
    });

    const saved = await this.inviteRepository.save(invite);

    await this.mailService.sendInviteEmail(email, token, caller.name, dto.role);

    const loaded = await this.findInviteById(saved.id);
    return this.toDetailDto(loaded);
  }

  async findAll(caller: UserSignature): Promise<InviteSummaryDto[]> {
    this.assertCanInvite(caller.role);

    const where =
      caller.role === Role.Superadmin ? {} : { invitedBy: { id: caller.id } };

    const invites = await this.inviteRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return invites.map((invite) => this.toSummaryDto(invite));
  }

  async accept(dto: AcceptInviteDto): Promise<InviteMessageResponseDto> {
    const invite = await this.findInviteByToken(dto.token);
    await this.assertInviteActionable(invite);

    if (invite.status !== InviteStatus.Pending) {
      throw new HttpException(
        'Convite não está pendente',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: invite.email },
    });
    if (existingUser) {
      throw new HttpException(
        'Já existe usuário com este email. Convites são apenas para novos usuários',
        HttpStatus.FORBIDDEN,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hashedPassword = await this.hashPassword(dto.password);

      const user = queryRunner.manager.create(User, {
        name: dto.name,
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
        isActive: true,
      });
      await queryRunner.manager.save(user);

      for (const company of invite.companies) {
        const userCompany = queryRunner.manager.create(UserCompany, {
          user,
          company,
          isActive: true,
        });
        await queryRunner.manager.save(userCompany);
      }

      invite.status = InviteStatus.Accepted;
      invite.acceptedAt = new Date();
      await queryRunner.manager.save(invite);

      await queryRunner.commitTransaction();

      return { message: 'Convite aceito com sucesso' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Falha ao aceitar convite', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findPublicDetailsByToken(
    token: string,
  ): Promise<InvitePublicDetailsDto> {
    const invite = await this.findInviteByToken(token);
    await this.assertInviteActionable(invite);

    return {
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      inviterName: invite.invitedBy.name,
      companies: (invite.companies ?? []).map((company) =>
        this.toCompanySummaryDto(company),
      ),
    };
  }

  async refuse(dto: RefuseInviteDto): Promise<InviteMessageResponseDto> {
    const invite = await this.findInviteByToken(dto.token);
    await this.assertInviteActionable(invite);

    if (invite.status !== InviteStatus.Pending) {
      throw new HttpException(
        'Convite não está pendente',
        HttpStatus.FORBIDDEN,
      );
    }

    invite.status = InviteStatus.Refused;
    invite.refusedAt = new Date();
    await this.inviteRepository.save(invite);

    return { message: 'Convite recusado' };
  }

  async cancel(id: string, caller: UserSignature): Promise<InviteDetailDto> {
    const invite = await this.findInviteById(id);
    this.assertInviteOwnership(invite, caller);

    if (
      invite.status !== InviteStatus.Pending &&
      invite.status !== InviteStatus.Expired
    ) {
      throw new HttpException(
        'Convite não pode ser cancelado neste status',
        HttpStatus.CONFLICT,
      );
    }

    invite.status = InviteStatus.Cancelled;
    invite.cancelledAt = new Date();
    await this.inviteRepository.save(invite);

    return this.toDetailDto(invite);
  }

  async resend(id: string, caller: UserSignature): Promise<InviteDetailDto> {
    const invite = await this.findInviteById(id);
    this.assertInviteOwnership(invite, caller);

    if (invite.status !== InviteStatus.Expired) {
      throw new HttpException(
        'Apenas convites expirados podem ser reenviados',
        HttpStatus.CONFLICT,
      );
    }

    const token = randomUUID();
    invite.token = token;
    invite.expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    invite.status = InviteStatus.Pending;
    await this.inviteRepository.save(invite);

    await this.mailService.sendInviteEmail(
      invite.email,
      token,
      invite.invitedBy.name,
      invite.role,
    );

    const loaded = await this.findInviteById(id);
    return this.toDetailDto(loaded);
  }

  private assertCanInvite(role: Role): void {
    if (!hasMinRole(role, Role.Editor)) {
      throw new HttpException(
        'Sem permissão para gerenciar convites',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertAssignableRole(inviterRole: Role, inviteRole: Role): void {
    if (!hasMinRole(inviterRole, inviteRole)) {
      throw new HttpException(
        'Sem permissão para atribuir esta role no convite',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertInviteOwnership(invite: Invite, caller: UserSignature): void {
    if (caller.role !== Role.Superadmin && invite.invitedBy.id !== caller.id) {
      throw new HttpException(
        'Sem permissão para gerenciar este convite',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async resolveCompanies(
    companyIds: string[],
    caller: UserSignature,
  ): Promise<Company[]> {
    const uniqueIds = [...new Set(companyIds)];

    const companies = await this.companyRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (companies.length !== uniqueIds.length) {
      throw new HttpException(
        'Uma ou mais empresas não foram encontradas',
        HttpStatus.NOT_FOUND,
      );
    }

    const inactive = companies.filter((c) => !c.isActive);
    if (inactive.length > 0) {
      throw new HttpException(
        'Não é possível convidar para empresas inativas',
        HttpStatus.FORBIDDEN,
      );
    }

    if (caller.role !== Role.Superadmin) {
      const callerCompanyIds = new Set(caller.companyIds);
      const outOfScope = uniqueIds.filter((id) => !callerCompanyIds.has(id));
      if (outOfScope.length > 0) {
        throw new HttpException(
          'Sem permissão para convidar para uma ou mais empresas informadas',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    return companies;
  }

  private async findInviteByToken(token: string): Promise<Invite> {
    const invite = await this.inviteRepository.findOne({
      where: { token },
      relations: { companies: true, invitedBy: true },
    });

    if (!invite) {
      throw new HttpException('Convite não encontrado', HttpStatus.NOT_FOUND);
    }

    return invite;
  }

  private async findInviteById(id: string): Promise<Invite> {
    const invite = await this.inviteRepository.findOne({
      where: { id },
      relations: { companies: true, invitedBy: true },
    });

    if (!invite) {
      throw new HttpException('Convite não encontrado', HttpStatus.NOT_FOUND);
    }

    return invite;
  }

  private async assertInviteActionable(invite: Invite): Promise<void> {
    if (
      invite.status === InviteStatus.Accepted ||
      invite.status === InviteStatus.Refused ||
      invite.status === InviteStatus.Cancelled
    ) {
      throw new HttpException(
        'Convite não está mais disponível',
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      invite.status === InviteStatus.Pending &&
      invite.expiresAt.getTime() < Date.now()
    ) {
      invite.status = InviteStatus.Expired;
      await this.inviteRepository.save(invite);
      throw new HttpException('Convite expirado', HttpStatus.FORBIDDEN);
    }
  }

  private toSummaryDto(invite: Invite): InviteSummaryDto {
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    };
  }

  private toDetailDto(invite: Invite): InviteDetailDto {
    return {
      ...this.toSummaryDto(invite),
      companies: (invite.companies ?? []).map((company) =>
        this.toCompanySummaryDto(company),
      ),
      acceptedAt: invite.acceptedAt,
      refusedAt: invite.refusedAt,
      cancelledAt: invite.cancelledAt,
      updatedAt: invite.updatedAt,
    };
  }

  private toCompanySummaryDto(company: Company): CompanySummaryDto {
    return {
      id: company.id,
      name: company.name,
      isActive: company.isActive,
    };
  }

  private async hashPassword(plain: string): Promise<string> {
    // bcrypt typings resolve as error in eslint; runtime is safe
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return (await hash(plain, 10)) as string;
  }
}
