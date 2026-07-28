import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Client } from './client.entity';
import { Company } from 'src/access/company/company.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateClientsDto,
  ClientDetailDto,
  ClientSummaryDto,
  CreateClientDto,
} from './client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async findAll(caller: UserSignature): Promise<ClientSummaryDto[]> {
    const qb = this.clientRepository
      .createQueryBuilder('client')
      .innerJoinAndSelect('client.company', 'company')
      .orderBy('client.name', 'ASC');

    if (caller.role !== Role.Superadmin) {
      if (caller.companyIds.length === 0) {
        return [];
      }
      qb.andWhere('company.id IN (:...companyIds)', {
        companyIds: caller.companyIds,
      });
    }

    const clients = await qb.getMany();
    return clients.map((client) => this.toSummaryDto(client));
  }

  async findOne(id: string, caller: UserSignature): Promise<ClientDetailDto> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: { company: true },
    });

    if (!client) {
      throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
    }

    if (
      caller.role !== Role.Superadmin &&
      !caller.companyIds.includes(client.company.id)
    ) {
      throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
    }

    return this.toDetailDto(client);
  }

  async create(
    dto: CreateClientDto,
    caller: UserSignature,
  ): Promise<ClientDetailDto> {
    this.assertSuperadmin(caller.role, 'criar clientes');

    const company = await this.companyRepository.findOne({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
    }

    const client = this.clientRepository.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
      company,
    });

    try {
      await this.clientRepository.save(client);
    } catch {
      throw new HttpException(
        'Nome de cliente já existe para esta empresa',
        HttpStatus.CONFLICT,
      );
    }

    return this.toDetailDto(client);
  }

  async updateMany(
    dto: BulkUpdateClientsDto,
    caller: UserSignature,
  ): Promise<ClientDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar clientes');

    const ids = dto.clients.map((item) => item.id);
    const clients = await this.clientRepository.find({
      where: { id: In(ids) },
      relations: { company: true },
    });

    if (clients.length !== ids.length) {
      throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
    }

    const clientsById = new Map(clients.map((client) => [client.id, client]));

    for (const item of dto.clients) {
      const client = clientsById.get(item.id)!;
      if (item.name !== undefined) client.name = item.name;
      if (item.description !== undefined) client.description = item.description;
      if (item.isActive !== undefined) client.isActive = item.isActive;
    }

    try {
      const updated = await this.clientRepository.manager.transaction(
        async (manager) => manager.save(Client, [...clientsById.values()]),
      );

      return updated.map((client) => this.toDetailDto(client));
    } catch {
      throw new HttpException(
        'Nome de cliente já existe para esta empresa',
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

  private toSummaryDto(client: Client): ClientSummaryDto {
    return {
      id: client.id,
      name: client.name,
      isActive: client.isActive,
      companyId: client.company.id,
    };
  }

  private toDetailDto(client: Client): ClientDetailDto {
    return {
      ...this.toSummaryDto(client),
      description: client.description,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
