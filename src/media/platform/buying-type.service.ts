import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuyingType } from './buying-type.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateBuyingTypesDto,
  BuyingTypeDetailDto,
  BuyingTypeSummaryDto,
  CreateBuyingTypesDto,
} from './buying-type.dto';

@Injectable()
export class BuyingTypeService {
  constructor(
    @InjectRepository(BuyingType)
    private readonly buyingTypeRepository: Repository<BuyingType>,
  ) {}

  async findAll(): Promise<BuyingTypeSummaryDto[]> {
    const buyingTypes = await this.buyingTypeRepository.find({
      order: { name: 'ASC' },
    });

    return buyingTypes.map((buyingType) => this.toSummaryDto(buyingType));
  }

  async findOne(id: string): Promise<BuyingTypeDetailDto> {
    const buyingType = await this.buyingTypeRepository.findOne({
      where: { id },
    });

    if (!buyingType) {
      throw new HttpException(
        'Tipo de compra não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toDetailDto(buyingType);
  }

  async createMany(
    dto: CreateBuyingTypesDto,
    caller: UserSignature,
  ): Promise<BuyingTypeDetailDto[]> {
    this.assertSuperadmin(caller.role, 'criar tipos de compra');

    const names = dto.buyingTypes.map((item) => item.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      throw new HttpException(
        'Nomes de tipo de compra duplicados na requisição',
        HttpStatus.CONFLICT,
      );
    }

    const buyingTypes = dto.buyingTypes.map((item) =>
      this.buyingTypeRepository.create({
        name: item.name,
        description: item.description,
        isActive: item.isActive ?? true,
      }),
    );

    try {
      const saved = await this.buyingTypeRepository.manager.transaction(
        async (manager) => manager.save(BuyingType, buyingTypes),
      );

      return saved.map((buyingType) => this.toDetailDto(buyingType));
    } catch {
      throw new HttpException(
        'Nome de tipo de compra já existe',
        HttpStatus.CONFLICT,
      );
    }
  }

  async updateMany(
    dto: BulkUpdateBuyingTypesDto,
    caller: UserSignature,
  ): Promise<BuyingTypeDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar tipos de compra');

    const ids = dto.buyingTypes.map((item) => item.id);
    const buyingTypes = await this.buyingTypeRepository.find({
      where: { id: In(ids) },
    });

    if (buyingTypes.length !== ids.length) {
      throw new HttpException(
        'Tipo de compra não encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const buyingTypesById = new Map(
      buyingTypes.map((buyingType) => [buyingType.id, buyingType]),
    );

    for (const item of dto.buyingTypes) {
      const buyingType = buyingTypesById.get(item.id)!;
      if (item.name !== undefined) buyingType.name = item.name;
      if (item.description !== undefined)
        buyingType.description = item.description;
      if (item.isActive !== undefined) buyingType.isActive = item.isActive;
    }

    try {
      const updated = await this.buyingTypeRepository.manager.transaction(
        async (manager) =>
          manager.save(BuyingType, [...buyingTypesById.values()]),
      );

      return updated.map((buyingType) => this.toDetailDto(buyingType));
    } catch {
      throw new HttpException(
        'Nome de tipo de compra já existe',
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

  private toSummaryDto(buyingType: BuyingType): BuyingTypeSummaryDto {
    return {
      id: buyingType.id,
      name: buyingType.name,
      isActive: buyingType.isActive,
    };
  }

  private toDetailDto(buyingType: BuyingType): BuyingTypeDetailDto {
    return {
      ...this.toSummaryDto(buyingType),
      description: buyingType.description,
      createdAt: buyingType.createdAt,
      updatedAt: buyingType.updatedAt,
    };
  }
}
