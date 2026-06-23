import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InviteService } from './invite.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Public } from 'src/access/auth/decorators/public.decorator';
import { Role } from 'src/shared/role.enum';
import {
  AcceptInviteDto,
  CreateInviteDto,
  InviteDetailDto,
  InviteMessageResponseDto,
  InvitePublicDetailsDto,
  InviteSummaryDto,
  RefuseInviteDto,
} from './invite.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Access, 'Invite'))
@ApiCookieAuth()
@Controller('access/invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Public()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceitar convite',
    description:
      'Aceita um convite pelo token. Cria novo usuário e vincula às empresas do convite. Rota pública.',
  })
  accept(@Body() dto: AcceptInviteDto): Promise<InviteMessageResponseDto> {
    return this.inviteService.accept(dto);
  }

  @Public()
  @Post('refuse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recusar convite',
    description: 'Recusa um convite pelo token. Rota pública.',
  })
  refuse(@Body() dto: RefuseInviteDto): Promise<InviteMessageResponseDto> {
    return this.inviteService.refuse(dto);
  }

  @Public()
  @Get('token/:token/details')
  @ApiOperation({
    summary: 'Detalhes públicos do convite',
    description:
      'Retorna informações do convite para exibição antes de aceitar ou recusar. Rota pública.',
  })
  findPublicDetails(
    @Param('token') token: string,
  ): Promise<InvitePublicDetailsDto> {
    return this.inviteService.findPublicDetailsByToken(token);
  }

  @Private(Role.Editor, Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Criar convite',
    description:
      'Cria convite para novo usuário e envia email. Editor só pode convidar para empresas às quais pertence.',
  })
  create(
    @Body() dto: CreateInviteDto,
    @CurrentUser() user: UserSignature,
  ): Promise<InviteDetailDto> {
    return this.inviteService.create(dto, user);
  }

  @Private(Role.Editor, Role.Superadmin)
  @Get()
  @ApiOperation({
    summary: 'Listar convites',
    description:
      'Lista convites enviados pelo usuário. Superadmin visualiza todos.',
  })
  findAll(@CurrentUser() user: UserSignature): Promise<InviteSummaryDto[]> {
    return this.inviteService.findAll(user);
  }

  @Private(Role.Editor, Role.Superadmin)
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar convite',
    description:
      'Cancela convite pendente ou expirado. Apenas quem enviou ou Superadmin.',
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<InviteDetailDto> {
    return this.inviteService.cancel(id, user);
  }

  @Private(Role.Editor, Role.Superadmin)
  @Post(':id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenviar convite',
    description:
      'Reenvia convite expirado com novo token e validade. Apenas quem enviou ou Superadmin.',
  })
  resend(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<InviteDetailDto> {
    return this.inviteService.resend(id, user);
  }
}
