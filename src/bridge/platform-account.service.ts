import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { PlatformAccount } from './platform-account.entity';
import { Client } from 'src/business/client/client.entity';
import { Platform } from 'src/media/platform/platform.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdatePlatformAccountsDto,
  CreatePlatformAccountDto,
  PlatformAccountDetailDto,
  PlatformAccountQueryDto,
  PlatformAccountSummaryDto,
} from './platform-account.dto';

@Injectable()
export class PlatformAccountService {
  constructor(
    @InjectRepository(PlatformAccount)
    private readonly platformAccountRepository: Repository<PlatformAccount>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
  ) {}

  async findAll(
    query: PlatformAccountQueryDto,
  ): Promise<PlatformAccountSummaryDto[]> {
    const where: FindOptionsWhere<PlatformAccount> = {};
    if (query.platformId) where.platform = { id: query.platformId };
    if (query.clientId) where.client = { id: query.clientId };
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const accounts = await this.platformAccountRepository.find({
      where,
      relations: { client: true, platform: true },
      order: { name: 'ASC' },
    });

    return accounts.map((account) => this.toSummaryDto(account));
  }

  async findOne(id: string): Promise<PlatformAccountDetailDto> {
    const account = await this.platformAccountRepository.findOne({
      where: { id },
      relations: { client: true, platform: true },
    });

    if (!account) {
      throw new HttpException(
        'Conta de plataforma não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toDetailDto(account);
  }

  async create(
    dto: CreatePlatformAccountDto,
    caller: UserSignature,
  ): Promise<PlatformAccountDetailDto> {
    this.assertSuperadmin(caller.role, 'criar contas de plataforma');

    const [client, platform] = await Promise.all([
      this.clientRepository.findOne({ where: { id: dto.clientId } }),
      this.platformRepository.findOne({ where: { id: dto.platformId } }),
    ]);

    if (!client) {
      throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
    }
    if (!platform) {
      throw new HttpException('Plataforma não encontrada', HttpStatus.NOT_FOUND);
    }

    const account = this.platformAccountRepository.create({
      externalAccountId: dto.externalAccountId,
      name: dto.name,
      isActive: dto.isActive ?? true,
      client,
      platform,
    });

    try {
      await this.platformAccountRepository.save(account);
    } catch {
      throw new HttpException(
        'Conta já associada para esta plataforma',
        HttpStatus.CONFLICT,
      );
    }

    return this.toDetailDto(account);
  }

  async updateMany(
    dto: BulkUpdatePlatformAccountsDto,
    caller: UserSignature,
  ): Promise<PlatformAccountDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar contas de plataforma');

    const ids = dto.platformAccounts.map((item) => item.id);
    const accounts = await this.platformAccountRepository.find({
      where: { id: In(ids) },
      relations: { client: true, platform: true },
    });

    if (accounts.length !== ids.length) {
      throw new HttpException(
        'Conta de plataforma não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    const accountsById = new Map(
      accounts.map((account) => [account.id, account]),
    );

    const clientIds = [
      ...new Set(
        dto.platformAccounts
          .map((item) => item.clientId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const clientsById = new Map<string, Client>();
    if (clientIds.length > 0) {
      const clients = await this.clientRepository.find({
        where: { id: In(clientIds) },
      });
      if (clients.length !== clientIds.length) {
        throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
      }
      for (const client of clients) {
        clientsById.set(client.id, client);
      }
    }

    for (const item of dto.platformAccounts) {
      const account = accountsById.get(item.id)!;
      if (item.name !== undefined) account.name = item.name;
      if (item.isActive !== undefined) account.isActive = item.isActive;
      if (item.clientId !== undefined) {
        account.client = clientsById.get(item.clientId)!;
      }
    }

    const updated = await this.platformAccountRepository.manager.transaction(
      async (manager) =>
        manager.save(PlatformAccount, [...accountsById.values()]),
    );

    return updated.map((account) => this.toDetailDto(account));
  }

  private assertSuperadmin(userRole: Role, action: string): void {
    if (userRole !== Role.Superadmin) {
      throw new HttpException(
        `Permissão insuficiente para ${action}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toSummaryDto(account: PlatformAccount): PlatformAccountSummaryDto {
    return {
      id: account.id,
      externalAccountId: account.externalAccountId,
      name: account.name,
      isActive: account.isActive,
      clientId: account.client.id,
      platformId: account.platform.id,
    };
  }

  private toDetailDto(account: PlatformAccount): PlatformAccountDetailDto {
    return {
      ...this.toSummaryDto(account),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
