import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Layer, layerTag } from 'src/shared/swagger/layer-tags';
import {
  AnalyticsMetricsQueryDto,
  AnalyticsMetricsResponseDto,
} from './analytics.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags(layerTag(Layer.Analytics, 'Metrics'))
@ApiCookieAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas do dashboard',
    description:
      'Agrega facts landed (analytics.ads_daily_metrics) com Bridge em tempo de leitura. ' +
      'Filtros hierárquicos Binder; derivados (cpm, cpc, …) após SUM. Qualquer autenticado.',
  })
  getMetrics(
    @Query() query: AnalyticsMetricsQueryDto,
    @CurrentUser() user: UserSignature,
  ): Promise<AnalyticsMetricsResponseDto> {
    return this.analyticsService.getMetrics(query, user);
  }
}
