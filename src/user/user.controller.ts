import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserCompanyService } from 'src/user-company/user-company.service';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/auth/userSignature.type';
import { Private } from 'src/auth/decorators/private.decorator';
import { Role } from 'src/common/role.enum';
import {
  MeResponseDto,
  UserDetailDto,
  UserSummaryDto,
  UserWithCompaniesDto,
} from './user.dto';
import {
  SyncUserCompaniesDto,
  UserCompanyMembershipDto,
} from 'src/user-company/user-company.dto';

@ApiTags('User')
@ApiCookieAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userCompanyService: UserCompanyService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Meu perfil',
    description:
      'Retorna o perfil do usuário autenticado e suas empresas ativas',
  })
  getMe(@CurrentUser() user: UserSignature): Promise<MeResponseDto> {
    return this.userService.getMe(user);
  }

  @Private(Role.Editor, Role.Superadmin)
  @Get()
  @ApiOperation({
    summary: 'Listar usuários',
    description:
      'Lista usuários das empresas acessíveis. Requer perfil Editor ou Superadmin. Superadmin também recebe as empresas vinculadas.',
  })
  findAll(
    @CurrentUser() user: UserSignature,
  ): Promise<UserSummaryDto[] | UserWithCompaniesDto[]> {
    return this.userService.findAll(user);
  }

  @Private(Role.Superadmin)
  @Patch('membership/:userCompanyId/revoke')
  @ApiOperation({
    summary: 'Revogar acesso à empresa',
    description:
      'Revoga o vínculo usuário-empresa (soft revoke) pelo ID do vínculo. Apenas Superadmin.',
  })
  revokeMembership(
    @Param('userCompanyId', ParseUUIDPipe) userCompanyId: string,
    @CurrentUser() user: UserSignature,
  ): Promise<UserCompanyMembershipDto> {
    return this.userCompanyService.revokeById(userCompanyId, user);
  }

  @Private(Role.Superadmin)
  @Put(':id/companies')
  @ApiOperation({
    summary: 'Sincronizar empresas do usuário',
    description:
      'Define os vínculos ativos do usuário para corresponder exatamente à lista informada. Apenas Superadmin.',
  })
  syncUserCompanies(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncUserCompaniesDto,
    @CurrentUser() user: UserSignature,
  ): Promise<UserWithCompaniesDto> {
    return this.userCompanyService.syncMemberships(id, dto.companyIds, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe de usuário',
    description:
      'Retorna detalhes de um usuário. Permitido para o próprio usuário ou para quem compartilha empresa.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<UserDetailDto> {
    return this.userService.findOne(id, user);
  }
}
