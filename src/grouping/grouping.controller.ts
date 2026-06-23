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
import { GroupingService } from './grouping.service';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/auth/userSignature.type';
import { Private } from 'src/auth/decorators/private.decorator';
import { Role } from 'src/common/role.enum';
import {
  BulkUpdateGroupingsDto,
  CreateGroupingDto,
  GroupingDetailDto,
  GroupingSummaryDto,
} from './grouping.dto';

@ApiTags('Grouping')
@ApiCookieAuth()
@Private(Role.Editor, Role.Superadmin)
@Controller('grouping')
export class GroupingController {
  constructor(private readonly groupingService: GroupingService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar agrupamentos',
    description:
      'Lista agrupamentos acessíveis ao usuário. Editor: empresas vinculadas. Superadmin: todos.',
  })
  findAll(@CurrentUser() user: UserSignature): Promise<GroupingSummaryDto[]> {
    return this.groupingService.findAll(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar agrupamento',
    description:
      'Cria um agrupamento vinculado a uma campanha. Editor e Superadmin.',
  })
  create(
    @Body() dto: CreateGroupingDto,
    @CurrentUser() user: UserSignature,
  ): Promise<GroupingDetailDto> {
    return this.groupingService.create(dto, user);
  }

  @Patch()
  @ApiOperation({
    summary: 'Editar agrupamentos',
    description:
      'Atualiza um ou mais agrupamentos em lote, incluindo desativação via isActive. Editor e Superadmin.',
  })
  updateMany(
    @Body() dto: BulkUpdateGroupingsDto,
    @CurrentUser() user: UserSignature,
  ): Promise<GroupingDetailDto[]> {
    return this.groupingService.updateMany(dto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe do agrupamento',
    description: 'Retorna detalhes de um agrupamento. Editor e Superadmin.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSignature,
  ): Promise<GroupingDetailDto> {
    return this.groupingService.findOne(id, user);
  }
}
