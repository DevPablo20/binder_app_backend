import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { PlatformAccount } from './platform-account.entity';
import { PlatformObjectMap } from './platform-object-map.entity';
import { Client } from 'src/business/client/client.entity';
import { Platform } from 'src/media/platform/platform.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  BulkCreatePlatformAccountsDto,
  BulkDeletePlatformAccountsDto,
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
        'Conta já associada a este cliente nesta plataforma',
        HttpStatus.CONFLICT,
      );
    }

    return this.toDetailDto(account);
  }

  async createMany(
    dto: BulkCreatePlatformAccountsDto,
    caller: UserSignature,
  ): Promise<PlatformAccountDetailDto[]> {
    this.assertSuperadmin(caller.role, 'criar contas de plataforma');

    const uniqueClientIds = [...new Set(dto.clientIds)];
    const [platform, clients] = await Promise.all([
      this.platformRepository.findOne({ where: { id: dto.platformId } }),
      this.clientRepository.find({ where: { id: In(uniqueClientIds) } }),
    ]);

    if (!platform) {
      throw new HttpException('Plataforma não encontrada', HttpStatus.NOT_FOUND);
    }
    if (clients.length !== uniqueClientIds.length) {
      throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
    }

    const clientsById = new Map(clients.map((client) => [client.id, client]));
    const accountsToCreate = dto.accounts.flatMap((account) =>
      uniqueClientIds.map((clientId) =>
        this.platformAccountRepository.create({
          externalAccountId: account.externalAccountId,
          name: account.name,
          isActive: dto.isActive ?? true,
          client: clientsById.get(clientId)!,
          platform,
        }),
      ),
    );

    try {
      const saved = await this.platformAccountRepository.save(accountsToCreate);
      const withRelations = await this.platformAccountRepository.find({
        where: { id: In(saved.map((account) => account.id)) },
        relations: { client: true, platform: true },
        order: { name: 'ASC' },
      });
      return withRelations.map((account) => this.toDetailDto(account));
    } catch {
      throw new HttpException(
        'Uma ou mais contas já estão associadas a estes clientes nesta plataforma',
        HttpStatus.CONFLICT,
      );
    }
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

    const accountIdsChangingClient: string[] = [];

    for (const item of dto.platformAccounts) {
      const account = accountsById.get(item.id)!;
      if (item.name !== undefined) account.name = item.name;
      if (item.isActive !== undefined) account.isActive = item.isActive;
      if (item.clientId !== undefined && item.clientId !== account.client.id) {
        accountIdsChangingClient.push(account.id);
        account.client = clientsById.get(item.clientId)!;
      }
    }

    const updated = await this.platformAccountRepository.manager.transaction(
      async (manager) => {
        if (accountIdsChangingClient.length > 0) {
          await manager
            .createQueryBuilder()
            .delete()
            .from(PlatformObjectMap)
            .where('platform_account_id IN (:...ids)', {
              ids: accountIdsChangingClient,
            })
            .execute();
        }
        return manager.save(PlatformAccount, [...accountsById.values()]);
      },
    );

    return updated.map((account) => this.toDetailDto(account));
  }

  async deleteMany(
    dto: BulkDeletePlatformAccountsDto,
    caller: UserSignature,
  ): Promise<void> {
    this.assertSuperadmin(caller.role, 'remover contas de plataforma');

    const uniqueIds = [...new Set(dto.ids)];
    if (uniqueIds.length === 0) return;

    const accounts = await this.platformAccountRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (accounts.length !== uniqueIds.length) {
      throw new HttpException(
        'Conta de plataforma não encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.platformAccountRepository.remove(accounts);
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
      clientName: account.client.name,
      platformId: account.platform.id,
      platformName: account.platform.name,
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
