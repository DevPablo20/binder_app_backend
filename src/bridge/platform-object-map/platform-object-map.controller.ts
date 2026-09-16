import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';
import { PlatformObjectMapService } from './platform-object-map.service';
import {
  BulkCreatePlatformObjectMapsDto,
  BulkDeletePlatformObjectMapsDto,
  BulkUpdatePlatformObjectMapsDto,
  CreatePlatformObjectMapDto,
  PlatformObjectMapDetailDto,
  PlatformObjectMapQueryDto,
  PlatformObjectMapSummaryDto,
} from './platform-object-map.dto';

@ApiTags(layerTag(Layer.Bridge, 'PlatformObjectMap'))
@ApiCookieAuth()
@Controller('bridge/platform-object-maps')
export class PlatformObjectMapController {
  constructor(
    private readonly platformObjectMapService: PlatformObjectMapService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar mapeamentos de objetos',
    description: 'Lista PlatformObjectMap. Qualquer usuário autenticado.',
  })
  findAll(
    @Query() query: PlatformObjectMapQueryDto,
  ): Promise<PlatformObjectMapSummaryDto[]> {
    return this.platformObjectMapService.findAll(query);
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Associar objeto de plataforma',
    description:
      'Mapeia um objeto do lake (campaign/ad_group/ad) a uma campanha Binder. Apenas Superadmin.',
  })
  create(
    @Body() dto: CreatePlatformObjectMapDto,
    @CurrentUser() user: UserSignature,
  ): Promise<PlatformObjectMapDetailDto> {
    return this.platformObjectMapService.create(dto, user);
  }

  @Private(Role.Superadmin)
  @Post('bulk')
  @ApiOperation({
    summary: 'Associar objetos de plataforma em lote',
    description:
      'Mapeia vários objetos do lake (campaign/ad_group/ad) a uma campanha Binder, ' +
      'compartilhando o mesmo enriquecimento. Apenas Superadmin.',
  })
  createMany(
    @Body() dto: BulkCreatePlatformObjectMapsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<PlatformObjectMapDetailDto[]> {
    return this.platformObjectMapService.createMany(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar mapeamentos de objetos',
    description:
      'Atualiza um ou mais mapeamentos em lote, incluindo labels e isActive. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdatePlatformObjectMapsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<PlatformObjectMapDetailDto[]> {
    return this.platformObjectMapService.updateMany(dto, user);
  }

  @Private(Role.Superadmin)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover mapeamentos de objetos',
    description:
      'Remove mapeamentos em lote (hard delete). Apenas Superadmin.',
  })
  deleteMany(
    @Body() dto: BulkDeletePlatformObjectMapsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<void> {
    return this.platformObjectMapService.deleteMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe do mapeamento de objeto',
    description:
      'Retorna detalhes de um PlatformObjectMap. Qualquer usuário autenticado.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlatformObjectMapDetailDto> {
    return this.platformObjectMapService.findOne(id);
  }
}
