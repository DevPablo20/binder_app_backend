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
import { CampaignService } from './campaign.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateCampaignsDto,
  CampaignDetailDto,
  CampaignSummaryDto,
  CreateCampaignDto,
} from './campaign.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Business, 'Campaign'))
@ApiCookieAuth()
@Controller('business/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar campanhas',
    description:
      'Lista campanhas. Superadmin: todas. Demais papéis: empresas vinculadas.',
  })
  findAll(@CurrentUser() user: UserSignature): Promise<CampaignSummaryDto[]> {
    return this.campaignService.findAll(user);
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Criar campanha',
    description: 'Cria uma campanha vinculada a um cliente. Apenas Superadmin.',
  })
  create(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: UserSignature,
  ): Promise<CampaignDetailDto> {
    return this.campaignService.create(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar campanhas',
    description:
      'Atualiza uma ou mais campanhas em lote, incluindo desativação via isActive. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdateCampaignsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<CampaignDetailDto[]> {
    return this.campaignService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe da campanha',
    description:
      'Retorna detalhes de uma campanha. Superadmin: qualquer. Demais: empresas vinculadas.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<CampaignDetailDto> {
    return this.campaignService.findOne(id, user);
  }
}
