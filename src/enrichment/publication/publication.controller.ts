import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Private } from 'src/access/auth/decorators/private.decorator';
import { Role } from 'src/shared/role.enum';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';
import { PublicationService } from './publication.service';
import {
  PendingChangesDto,
  PublicationDetailDto,
  PublicationDto,
} from './publication.dto';

@ApiTags(layerTag(Layer.Enrichment, 'Publication'))
@ApiCookieAuth()
@Controller('enrichment/publications')
export class PublicationController {
  constructor(private readonly publicationService: PublicationService) {}

  @Get('pending-changes')
  @ApiOperation({
    summary: 'Alterações não publicadas',
    description:
      'Compara a configuração do Bridge com a última publicação. Qualquer usuário autenticado.',
  })
  pendingChanges(): Promise<PendingChangesDto> {
    return this.publicationService.pendingChanges();
  }

  @Get()
  @ApiOperation({
    summary: 'Histórico de publicações',
    description:
      'Lista as publicações com tamanho do snapshot e resumo das rodadas. ' +
      'Qualquer usuário autenticado.',
  })
  findAll(): Promise<PublicationDto[]> {
    return this.publicationService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhe da publicação',
    description:
      'Retorna a publicação com o snapshot congelado. Qualquer usuário autenticado.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicationDetailDto> {
    return this.publicationService.findOne(id);
  }

  @Private(Role.Superadmin)
  @Post()
  @ApiOperation({
    summary: 'Publicar',
    description:
      'Congela a configuração corrente num snapshot imutável. Não dispara processamento: a ' +
      'próxima rodada do DAG é quem busca. Publicação pendente que ainda não foi usada por ' +
      'nenhuma rodada é marcada como superseded. Apenas Superadmin.',
  })
  publish(@CurrentUser() user: UserSignature): Promise<PublicationDetailDto> {
    return this.publicationService.publish(user);
  }
}
