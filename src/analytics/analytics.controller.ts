import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/access/auth/decorators/currentUser.decorator';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Layer, layerTag } from 'src/shared/swagger/layer-tags';
import { AnalyticsChatService } from './analytics-chat.service';
import {
  AnalyticsChatRequestDto,
  AnalyticsChatResponseDto,
  AnalyticsMetricsQueryDto,
  AnalyticsMetricsResponseDto,
} from './analytics.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags(layerTag(Layer.Analytics, 'Metrics'))
@ApiCookieAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly analyticsChatService: AnalyticsChatService,
  ) {}

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

  @Post('chat')
  @ApiOperation({
    summary: 'Chat de insights (Gemini)',
    description:
      'Conversa com Gemini usando a ferramenta get_metrics (mesmo ACL de /analytics/metrics). ' +
      'Envie o contexto de filtros do dashboard para ancorar a resposta.',
  })
  chat(
    @Body() dto: AnalyticsChatRequestDto,
    @CurrentUser() user: UserSignature,
  ): Promise<AnalyticsChatResponseDto> {
    return this.analyticsChatService.chat(dto, user);
  }
}
