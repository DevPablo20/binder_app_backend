import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/access/auth/decorators/public.decorator';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';
import { RunService } from 'src/enrichment/run/run.service';
import {
  CloseRunDto,
  OpenRunResultDto,
  RunDto,
} from 'src/enrichment/run/run.dto';
import { ApiKeyGuard, API_KEY_HEADER } from './api-key.guard';

/**
 * As duas chamadas do DAG: uma no começo da rodada, outra no fim.
 *
 * Controller separado do operador porque a autenticação é outra — misturar JWT e chave de API no
 * mesmo controller esconde qual rota é de robô.
 */
@ApiTags(layerTag(Layer.Enrichment, 'Dag'))
@ApiHeader({ name: API_KEY_HEADER, required: true })
@Public()
@UseGuards(ApiKeyGuard)
@Controller('enrichment/dag')
export class DagController {
  constructor(private readonly runService: RunService) {}

  @Post('runs')
  @ApiOperation({
    summary: 'Abrir rodada e buscar a publicação corrente',
    description:
      'Abre a rodada e devolve o snapshot que ela deve usar. Sem publicação alguma, devolve ' +
      'publicationId nulo e snapshot vazio — a rodada roda com configuração vazia.',
  })
  open(): Promise<OpenRunResultDto> {
    return this.runService.open();
  }

  @Patch('runs/:id')
  @ApiOperation({
    summary: 'Encerrar rodada',
    description:
      'Fecha a rodada com success ou failed. Sucesso marca a publicação como materializada.',
  })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseRunDto,
  ): Promise<RunDto> {
    return this.runService.close(id, dto);
  }
}
