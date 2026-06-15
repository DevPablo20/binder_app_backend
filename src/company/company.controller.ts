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
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/auth/userSignature.type';
import { Private } from 'src/auth/decorators/private.decorator';
import { Role } from 'src/common/role.enum';
import {
  CompanyDetailDto,
  CompanySummaryDto,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './company.dto';
import { UserSummaryDto } from 'src/user/user.dto';

@ApiTags('Company')
@ApiCookieAuth()
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({
    summary: 'Minhas empresas',
    description:
      'Lista as empresas ativas às quais o usuário autenticado tem acesso',
  })
  findAll(@CurrentUser() user: UserSignature): Promise<CompanySummaryDto[]> {
    return this.companyService.findAll(user);
  }

  @Private(Role.Superadmin)
  @Get('admin/all')
  @ApiOperation({
    summary: 'Listar todas as empresas',
    description:
      'Lista todas as empresas (ativas e inativas). Apenas Superadmin.',
  })
  findAllForAdmin(
    @CurrentUser() user: UserSignature,
  ): Promise<CompanyDetailDto[]> {
    return this.companyService.findAllForAdmin(user);
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
  ): Promise<UserSummaryDto[]> {
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

  @Private(Role.Superadmin)
  @Patch(':id')
  @ApiOperation({
    summary: 'Editar empresa',
    description: 'Atualiza dados de uma empresa. Apenas Superadmin.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: UserSignature,
  ): Promise<CompanyDetailDto> {
    return this.companyService.update(id, dto, user);
  }
}
