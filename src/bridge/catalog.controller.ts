import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { layerTag, Layer } from 'src/shared/swagger/layer-tags';
import { CatalogService } from './catalog.service';
import { CatalogItemDto, CatalogQueryDto } from './catalog.dto';

@ApiTags(layerTag(Layer.Bridge, 'Catalog'))
@ApiCookieAuth()
@Controller('bridge/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':platformId')
  @ApiOperation({
    summary: 'Listar identidades do lake com status de mapeamento',
    description:
      'Consulta o catálogo do lake via ETL e enriquece com isMapped / ids Bridge. ' +
      'Use unmatchedOnly=true para ver apenas itens ainda não associados. ' +
      'Qualquer usuário autenticado.',
  })
  getCatalog(
    @Param('platformId', ParseUUIDPipe) platformId: string,
    @Query() query: CatalogQueryDto,
  ): Promise<CatalogItemDto[]> {
    return this.catalogService.getCatalog(platformId, query);
  }
}
