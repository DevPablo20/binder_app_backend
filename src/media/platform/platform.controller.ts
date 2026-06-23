import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdatePlatformsDto,
  CreatePlatformDto,
  PlatformDetailDto,
  PlatformSummaryDto,
} from './platform.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Media, 'Platform'))
@ApiCookieAuth()
@Controller('media/platforms')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar plataformas',
    description: 'Lista todas as plataformas. Qualquer usuário autenticado.',
  })
  findAll(): Promise<PlatformSummaryDto[]> {
    return this.platformService.findAll();
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Criar plataforma',
    description: 'Cria uma plataforma. Apenas Superadmin.',
  })
  create(
    @Body() dto: CreatePlatformDto,
    @CurrentUser() user: UserSignature,
  ): Promise<PlatformDetailDto> {
    return this.platformService.create(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar plataformas',
    description:
      'Atualiza uma ou mais plataformas em lote, incluindo desativação via isActive. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdatePlatformsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<PlatformDetailDto[]> {
    return this.platformService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe da plataforma',
    description: 'Retorna detalhes de uma plataforma. Qualquer usuário autenticado.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlatformDetailDto> {
    return this.platformService.findOne(id);
  }
}
