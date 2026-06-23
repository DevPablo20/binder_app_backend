import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Platform } from './platform.entity';
import { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdatePlatformsDto,
  CreatePlatformDto,
  PlatformDetailDto,
  PlatformSummaryDto,
} from './platform.dto';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
  ) {}

  async findAll(): Promise<PlatformSummaryDto[]> {
    const platforms = await this.platformRepository.find({
      order: { name: 'ASC' },
    });

    return platforms.map((platform) => this.toSummaryDto(platform));
  }

  async findOne(id: string): Promise<PlatformDetailDto> {
    const platform = await this.platformRepository.findOne({
      where: { id },
    });

    if (!platform) {
      throw new HttpException('Plataforma não encontrada', HttpStatus.NOT_FOUND);
    }

    return this.toDetailDto(platform);
  }

  async create(
    dto: CreatePlatformDto,
    caller: UserSignature,
  ): Promise<PlatformDetailDto> {
    this.assertSuperadmin(caller.role, 'criar plataformas');

    const platform = this.platformRepository.create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    try {
      await this.platformRepository.save(platform);
    } catch {
      throw new HttpException(
        'Nome de plataforma já existe',
        HttpStatus.CONFLICT,
      );
    }

    return this.toDetailDto(platform);
  }

  async updateMany(
    dto: BulkUpdatePlatformsDto,
    caller: UserSignature,
  ): Promise<PlatformDetailDto[]> {
    this.assertSuperadmin(caller.role, 'editar plataformas');

    const ids = dto.platforms.map((item) => item.id);
    const platforms = await this.platformRepository.find({
      where: { id: In(ids) },
    });

    if (platforms.length !== ids.length) {
      throw new HttpException('Plataforma não encontrada', HttpStatus.NOT_FOUND);
    }

    const platformsById = new Map(
      platforms.map((platform) => [platform.id, platform]),
    );

    for (const item of dto.platforms) {
      const platform = platformsById.get(item.id)!;
      if (item.name !== undefined) platform.name = item.name;
      if (item.description !== undefined) platform.description = item.description;
      if (item.isActive !== undefined) platform.isActive = item.isActive;
    }

    try {
      const updated = await this.platformRepository.manager.transaction(
        async (manager) => manager.save(Platform, [...platformsById.values()]),
      );

      return updated.map((platform) => this.toDetailDto(platform));
    } catch {
      throw new HttpException(
        'Nome de plataforma já existe',
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

  private toSummaryDto(platform: Platform): PlatformSummaryDto {
    return {
      id: platform.id,
      name: platform.name,
      isActive: platform.isActive,
    };
  }

  private toDetailDto(platform: Platform): PlatformDetailDto {
    return {
      ...this.toSummaryDto(platform),
      description: platform.description,
      createdAt: platform.createdAt,
      updatedAt: platform.updatedAt,
    };
  }
}
