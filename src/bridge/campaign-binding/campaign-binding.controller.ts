import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';
import { CampaignBindingService } from './campaign-binding.service';
import {
  CampaignBindingDto,
  CampaignBindingQueryDto,
  DeleteCampaignBindingsDto,
  UpsertCampaignBindingsDto,
  UpsertCampaignBindingsResultDto,
} from './campaign-binding.dto';

@ApiTags(layerTag(Layer.Bridge, 'CampaignBinding'))
@ApiCookieAuth()
@Controller('bridge/campaign-bindings')
export class CampaignBindingController {
  constructor(
    private readonly campaignBindingService: CampaignBindingService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar vínculos de campanha',
    description:
      'Lista os vínculos com cliente, campanha de negócio, channel e buying type resolvidos. ' +
      'Qualquer usuário autenticado.',
  })
  findAll(
    @Query() query: CampaignBindingQueryDto,
  ): Promise<CampaignBindingDto[]> {
    return this.campaignBindingService.findAll(query);
  }

  @Private(Role.Superadmin)
  @Put()
  @ApiOperation({
    summary: 'Vincular campanhas',
    description:
      'Upsert em lote pela chave natural (conta, campanha da plataforma): cria o que não existe ' +
      'e atualiza o que existe. Idempotente — resalvar a mesma seleção não falha. Trocar a ' +
      'campanha de negócio de um vínculo apaga as classificações de ad_group dele, e a resposta ' +
      'diz quantas. Apenas Superadmin.',
  })
  upsert(
    @Body() dto: UpsertCampaignBindingsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<UpsertCampaignBindingsResultDto> {
    return this.campaignBindingService.upsert(dto, user);
  }

  @Private(Role.Superadmin)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover vínculos de campanha',
    description:
      'Remove vínculos em lote. Cascateia para as classificações de ad_group. Apenas Superadmin.',
  })
  deleteMany(
    @Body() dto: DeleteCampaignBindingsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<void> {
    return this.campaignBindingService.deleteMany(dto, user);
  }
}
