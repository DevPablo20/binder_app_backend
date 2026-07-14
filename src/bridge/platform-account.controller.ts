import {
  Body,
  Controller,
  Get,
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
import { PlatformAccountService } from './platform-account.service';
import {
  BulkUpdatePlatformAccountsDto,
  CreatePlatformAccountDto,
  PlatformAccountDetailDto,
  PlatformAccountQueryDto,
  PlatformAccountSummaryDto,
} from './platform-account.dto';

@ApiTags(layerTag(Layer.Bridge, 'PlatformAccount'))
@ApiCookieAuth()
@Controller('bridge/platform-accounts')
export class PlatformAccountController {
  constructor(
    private readonly platformAccountService: PlatformAccountService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar contas de plataforma',
    description: 'Lista contas Bridge. Qualquer usuário autenticado.',
  })
  findAll(
    @Query() query: PlatformAccountQueryDto,
  ): Promise<PlatformAccountSummaryDto[]> {
    return this.platformAccountService.findAll(query);
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Associar conta de plataforma',
    description:
      'Associa um account_id do lake a um cliente e plataforma. Apenas Superadmin.',
  })
  create(
    @Body() dto: CreatePlatformAccountDto,
    @CurrentUser() user: UserSignature,
  ): Promise<PlatformAccountDetailDto> {
    return this.platformAccountService.create(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar contas de plataforma',
    description:
      'Atualiza uma ou mais contas em lote, incluindo desativação via isActive. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdatePlatformAccountsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<PlatformAccountDetailDto[]> {
    return this.platformAccountService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe da conta de plataforma',
    description: 'Retorna detalhes de uma conta Bridge. Qualquer usuário autenticado.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlatformAccountDetailDto> {
    return this.platformAccountService.findOne(id);
  }
}
