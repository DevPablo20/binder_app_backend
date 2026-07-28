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
import { ClientService } from './client.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateClientsDto,
  ClientDetailDto,
  ClientSummaryDto,
  CreateClientDto,
} from './client.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Business, 'Client'))
@ApiCookieAuth()
@Controller('business/clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar clientes',
    description:
      'Lista clientes. Superadmin: todos. Demais papéis: empresas vinculadas.',
  })
  findAll(@CurrentUser() user: UserSignature): Promise<ClientSummaryDto[]> {
    return this.clientService.findAll(user);
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Criar cliente',
    description: 'Cria um cliente vinculado a uma empresa. Apenas Superadmin.',
  })
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser() user: UserSignature,
  ): Promise<ClientDetailDto> {
    return this.clientService.create(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar clientes',
    description:
      'Atualiza um ou mais clientes em lote, incluindo desativação via isActive. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdateClientsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<ClientDetailDto[]> {
    return this.clientService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe do cliente',
    description:
      'Retorna detalhes de um cliente. Superadmin: qualquer. Demais: empresas vinculadas.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<ClientDetailDto> {
    return this.clientService.findOne(id, user);
  }
}
