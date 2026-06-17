import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserCompanyService } from './user-company.service';
import {
  SyncUserCompaniesDto,
  UserCompanyMembershipDto,
} from './user-company.dto';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/auth/userSignature.type';
import { Private } from 'src/auth/decorators/private.decorator';
import { Role } from 'src/common/role.enum';
import { UserWithCompaniesDto } from 'src/user/user.dto';

@ApiTags('UserCompany')
@ApiCookieAuth()
@Controller('user-company')
export class UserCompanyController {
  constructor(private readonly userCompanyService: UserCompanyService) {}

  @Private(Role.Superadmin)
  @Patch(':id/revoke')
  @ApiOperation({
    summary: 'Revogar acesso à empresa',
    description:
      'Revoga o vínculo usuário-empresa (soft revoke) pelo ID do vínculo. Apenas Superadmin.',
  })
  revokeMembership(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<UserCompanyMembershipDto> {
    return this.userCompanyService.revokeById(id, user);
  }

  @Private(Role.Superadmin)
  @Put('user/:userId/sync')
  @ApiOperation({
    summary: 'Sincronizar empresas do usuário',
    description:
      'Define os vínculos ativos do usuário para corresponder exatamente à lista informada. Apenas Superadmin.',
  })
  syncUserCompanies(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SyncUserCompaniesDto,
    @CurrentUser() user: UserSignature,
  ): Promise<UserWithCompaniesDto> {
    return this.userCompanyService.syncMemberships(
      userId,
      dto.companyIds,
      user,
    );
  }
}
