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
import { BuyingTypeService } from './buying-type.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateBuyingTypesDto,
  BuyingTypeDetailDto,
  BuyingTypeSummaryDto,
  CreateBuyingTypesDto,
} from './buying-type.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Media, 'BuyingType'))
@ApiCookieAuth()
@Controller('media/buying-types')
export class BuyingTypeController {
  constructor(private readonly buyingTypeService: BuyingTypeService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tipos de compra',
    description: 'Lista todos os tipos de compra. Qualquer usuário autenticado.',
  })
  findAll(): Promise<BuyingTypeSummaryDto[]> {
    return this.buyingTypeService.findAll();
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Criar tipos de compra',
    description:
      'Cria um ou mais tipos de compra. Apenas Superadmin.',
  })
  createMany(
    @Body() dto: CreateBuyingTypesDto,
    @CurrentUser() user: UserSignature,
  ): Promise<BuyingTypeDetailDto[]> {
    return this.buyingTypeService.createMany(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar tipos de compra',
    description:
      'Atualiza um ou mais tipos de compra em lote, incluindo desativação via isActive. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdateBuyingTypesDto,
    @CurrentUser() user: UserSignature,
  ): Promise<BuyingTypeDetailDto[]> {
    return this.buyingTypeService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe do tipo de compra',
    description:
      'Retorna detalhes de um tipo de compra. Qualquer usuário autenticado.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BuyingTypeDetailDto> {
    return this.buyingTypeService.findOne(id);
  }
}
