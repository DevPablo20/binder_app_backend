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
import { ChannelService } from './channel.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateChannelsDto,
  ChannelDetailDto,
  ChannelSummaryDto,
  CreateChannelsDto,
} from './channel.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Media, 'Channel'))
@ApiCookieAuth()
@Controller('media/channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar canais',
    description: 'Lista todos os canais. Qualquer usuário autenticado.',
  })
  findAll(): Promise<ChannelSummaryDto[]> {
    return this.channelService.findAll();
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Criar canais',
    description:
      'Cria um ou mais canais vinculados a uma plataforma. Apenas Superadmin.',
  })
  createMany(
    @Body() dto: CreateChannelsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<ChannelDetailDto[]> {
    return this.channelService.createMany(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar canais',
    description:
      'Atualiza um ou mais canais em lote, incluindo desativação via isActive. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdateChannelsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<ChannelDetailDto[]> {
    return this.channelService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe do canal',
    description: 'Retorna detalhes de um canal. Qualquer usuário autenticado.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChannelDetailDto> {
    return this.channelService.findOne(id);
  }
}
