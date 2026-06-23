import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';
import {
  MeResponseDto,
  UserDetailDto,
  UserSummaryDto,
  UserWithCompaniesDto,
} from './user.dto';

@ApiTags(layerTag(Layer.Access, 'User'))
@ApiCookieAuth()
@Controller('access/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
