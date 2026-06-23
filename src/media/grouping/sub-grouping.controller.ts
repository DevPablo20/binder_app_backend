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
import { SubGroupingService } from './sub-grouping.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateSubGroupingsDto,
  CreateSubGroupingsDto,
  SubGroupingDetailDto,
  SubGroupingSummaryDto,
} from './sub-grouping.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Media, 'SubGrouping'))
@ApiCookieAuth()
@Private(Role.Editor, Role.Superadmin)
@Controller('media/sub-groupings')
export class SubGroupingController {
  constructor(private readonly subGroupingService: SubGroupingService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar sub-agrupamentos',
    description:
      'Lista sub-agrupamentos acessíveis ao usuário. Editor: empresas vinculadas. Superadmin: todos.',
  })
  findAll(
    @CurrentUser() user: UserSignature,
  ): Promise<SubGroupingSummaryDto[]> {
    return this.subGroupingService.findAll(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar sub-agrupamentos',
    description:
      'Cria um ou mais sub-agrupamentos vinculados a um agrupamento. Editor e Superadmin.',
  })
  createMany(
    @Body() dto: CreateSubGroupingsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<SubGroupingDetailDto[]> {
    return this.subGroupingService.createMany(dto, user);
  }

  @Patch()
  @ApiOperation({
    summary: 'Editar sub-agrupamentos',
    description:
      'Atualiza um ou mais sub-agrupamentos em lote, incluindo desativação via isActive. Editor e Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdateSubGroupingsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<SubGroupingDetailDto[]> {
    return this.subGroupingService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe do sub-agrupamento',
    description: 'Retorna detalhes de um sub-agrupamento. Editor e Superadmin.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<SubGroupingDetailDto> {
    return this.subGroupingService.findOne(id, user);
  }
}
