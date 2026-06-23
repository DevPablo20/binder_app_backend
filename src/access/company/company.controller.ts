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
import { CompanyService } from './company.service';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import {
  BulkUpdateCompaniesDto,
  CompanyDetailDto,
  CompanySummaryDto,
  CompanyWithUsersDto,
  CreateCompanyDto,
} from './company.dto';
import { UserWithMembershipDto } from 'src/access/user-company/user-company.dto';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';

@ApiTags(layerTag(Layer.Access, 'Company'))
@ApiCookieAuth()
@Controller('access/companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Minhas empresas',
    description:
      'Lista as empresas ativas às quais o usuário autenticado tem acesso via userCompanies',
  })
  findMe(@CurrentUser() user: UserSignature): Promise<CompanySummaryDto[]> {
    return this.companyService.findMe(user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar empresas',
    description:
      'Viewer: mesmas empresas de GET /access/companies/me. Editor: empresas vinculadas com usuários. Superadmin: todas as empresas com usuários.',
  })
  findAll(
    @CurrentUser() user: UserSignature,
  ): Promise<CompanySummaryDto[] | CompanyWithUsersDto[]> {
    return this.companyService.findAll(user);
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Criar empresa',
    description:
      'Cria uma empresa e vincula o Superadmin criador automaticamente. Apenas Superadmin.',
  })
  create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: UserSignature,
  ): Promise<CompanyDetailDto> {
    return this.companyService.create(dto, user);
  }

  @Private(Role.Superadmin)
  @Patch()
  @ApiOperation({
    summary: 'Editar empresas',
    description: 'Atualiza uma ou mais empresas em lote. Apenas Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdateCompaniesDto,
    @CurrentUser() user: UserSignature,
  ): Promise<CompanyDetailDto[]> {
    return this.companyService.updateMany(dto, user);
  }

  @Private(Role.Editor, Role.Superadmin)
  @Get(':id/users')
  @ApiOperation({
    summary: 'Usuários da empresa',
    description:
      'Lista usuários ativos vinculados à empresa. Requer perfil Editor ou Superadmin.',
  })
  findUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<UserWithMembershipDto[]> {
    return this.companyService.findUsersByCompany(id, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe da empresa',
    description:
      'Retorna detalhes de uma empresa acessível ao usuário. Superadmin pode consultar qualquer empresa.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<CompanyDetailDto> {
    return this.companyService.findOne(id, user);
  }
}
