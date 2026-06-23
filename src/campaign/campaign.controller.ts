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
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/auth/userSignature.type';
import { Private } from 'src/auth/decorators/private.decorator';
import { Role } from 'src/common/role.enum';
import {
  BulkUpdateCampaignsDto,
  CampaignDetailDto,
  CampaignSummaryDto,
  CreateCampaignDto,
} from './campaign.dto';

@ApiTags('Campaign')
@ApiCookieAuth()
@Private(Role.Superadmin)
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar campanhas',
    description: 'Lista todas as campanhas. Apenas Superadmin.',
  })
  findAll(@CurrentUser() user: UserSignature): Promise<CampaignSummaryDto[]> {
    return this.campaignService.findAll(user);
  }

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
    description: 'Retorna detalhes de uma campanha. Apenas Superadmin.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<CampaignDetailDto> {
    return this.campaignService.findOne(id, user);
  }
}
