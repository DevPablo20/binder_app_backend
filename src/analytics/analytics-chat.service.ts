import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPartFromFunctionResponse,
  FunctionCallingConfigMode,
  GoogleGenAI,
  Type,
  type Content,
  type FunctionCall,
  type FunctionDeclaration,
  type Part,
} from '@google/genai';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import {
  AnalyticsChatRequestDto,
  AnalyticsChatResponseDto,
  AnalyticsGroupBy,
  AnalyticsMetricsQueryDto,
  AnalyticsMetricsResponseDto,
  MetricBlockDto,
} from './analytics.dto';
import { AnalyticsService } from './analytics.service';

const MAX_TOOL_ROUNDS = 3;
const MAX_BREAKDOWN_ROWS = 25;
const MAX_SERIES_ROWS = 60;

const GET_METRICS_TOOL: FunctionDeclaration = {
  name: 'get_metrics',
  description:
    'Busca métricas agregadas de mídia (spend, impressões, cliques, CTR, CPM, etc.) ' +
    'usando os mesmos filtros hierárquicos do dashboard Binder. Use sempre esta ferramenta ' +
    'antes de afirmar números. Não invente valores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      companyId: {
        type: Type.STRING,
        description: 'UUID da empresa (company). Preferir o contexto do dashboard.',
      },
      clientId: { type: Type.STRING, description: 'UUID do cliente' },
      campaignId: { type: Type.STRING, description: 'UUID da campanha' },
      platformId: { type: Type.STRING, description: 'UUID da plataforma' },
      channelId: { type: Type.STRING, description: 'UUID do canal' },
      buyingTypeId: { type: Type.STRING, description: 'UUID do tipo de compra' },
      subGroupingId: { type: Type.STRING, description: 'UUID do sub-agrupamento' },
      from: {
        type: Type.STRING,
        description: 'Data inicial inclusiva YYYY-MM-DD',
      },
      to: {
        type: Type.STRING,
        description: 'Data final inclusiva YYYY-MM-DD',
      },
      groupBy: {
        type: Type.STRING,
        description: 'Dimensão de breakdown',
        enum: Object.values(AnalyticsGroupBy),
      },
    },
  },
};

@Injectable()
export class AnalyticsChatService {
  private readonly logger = new Logger(AnalyticsChatService.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly config: ConfigService,
  ) {}

  async chat(
    dto: AnalyticsChatRequestDto,
    caller: UserSignature,
  ): Promise<AnalyticsChatResponseDto> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Insights chat indisponível: GEMINI_API_KEY não configurada',
      );
    }

    const model =
      this.config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-3.1-flash-lite';
    const ai = new GoogleGenAI({ apiKey });

    const context = dto.context ?? {};
    const contents = this.buildContents(dto, context);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: this.systemInstruction(context),
          tools: [{ functionDeclarations: [GET_METRICS_TOOL] }],
          automaticFunctionCalling: { disable: true },
        },
      });

      const functionCalls = response.functionCalls;
      if (!functionCalls?.length) {
        const reply = response.text?.trim();
        if (!reply) {
          throw new ServiceUnavailableException(
            'Insights chat não retornou resposta',
          );
        }
        return { reply };
      }

      // Keep original model parts (incl. thoughtSignature) — required by Gemini 3.x tools.
      const modelContent = response.candidates?.[0]?.content;
      if (!modelContent?.parts?.length) {
        throw new ServiceUnavailableException(
          'Insights chat retornou function call sem conteúdo do modelo',
        );
      }

      const toolParts: Part[] = [];
      for (const call of functionCalls) {
        if (!call.name) continue;
        toolParts.push(await this.executeTool(call, context, caller));
      }

      contents.push({
        role: modelContent.role ?? 'model',
        parts: modelContent.parts,
      });
      contents.push({ role: 'user', parts: toolParts });
    }

    const final = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: this.systemInstruction(context),
        tools: [{ functionDeclarations: [GET_METRICS_TOOL] }],
        automaticFunctionCalling: { disable: true },
        toolConfig: {
          functionCallingConfig: { mode: FunctionCallingConfigMode.NONE },
        },
      },
    });

    const reply = final.text?.trim();
    if (!reply) {
      throw new ServiceUnavailableException(
        'Insights chat não retornou resposta após consultar métricas',
      );
    }
    return { reply };
  }

  private systemInstruction(context: AnalyticsMetricsQueryDto): string {
    return [
      'Você é o assistente de Insights da plataforma Binder.',
      'Responda em português do Brasil, de forma clara e objetiva.',
      'Você analisa métricas de mídia (Meta, Google, TikTok, etc.) enriquecidas pela Bridge.',
      'Nunca invente números, taxas ou rankings. Use a ferramenta get_metrics para obter dados.',
      'Se a ferramenta falhar ou não houver dados, diga isso explicitamente.',
      'Cite o período (from/to) e o recorte usado ao apresentar KPIs.',
      'Métricas disponíveis: impressions, cost (investimento), clicks, videoViews, videoViews100p, engagement,',
      'e derivados: cpm, cpc, cpvc, cpe, ctr, vtr, vtrc, er.',
      `Contexto atual do dashboard (defaults se o usuário não especificar outro filtro): ${JSON.stringify(context)}`,
    ].join(' ');
  }

  private buildContents(
    dto: AnalyticsChatRequestDto,
    context: AnalyticsMetricsQueryDto,
  ): Content[] {
    const contents: Content[] = [];

    for (const msg of dto.history ?? []) {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    const contextHint =
      Object.keys(context).length > 0
        ? `\n\n[Contexto do dashboard: ${JSON.stringify(context)}]`
        : '';

    contents.push({
      role: 'user',
      parts: [{ text: `${dto.message}${contextHint}` }],
    });

    return contents;
  }

  private async executeTool(
    call: FunctionCall,
    context: AnalyticsMetricsQueryDto,
    caller: UserSignature,
  ): Promise<Part> {
    const name = call.name ?? 'unknown';
    const id = call.id ?? '';

    try {
      if (name !== 'get_metrics') {
        return createPartFromFunctionResponse(id, name, {
          error: `Ferramenta desconhecida: ${name}`,
        });
      }

      const query = this.mergeQuery(context, call.args ?? {});
      const metrics = await this.analyticsService.getMetrics(query, caller);
      return createPartFromFunctionResponse(id, name, {
        data: this.compactMetrics(metrics),
      });
    } catch (error) {
      const message =
        error instanceof ForbiddenException
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Erro ao consultar métricas';

      this.logger.warn(`get_metrics failed: ${message}`);
      return createPartFromFunctionResponse(id, name, { error: message });
    }
  }

  private mergeQuery(
    context: AnalyticsMetricsQueryDto,
    args: Record<string, unknown>,
  ): AnalyticsMetricsQueryDto {
    const pickString = (key: keyof AnalyticsMetricsQueryDto): string | undefined => {
      const fromArgs = args[key];
      if (typeof fromArgs === 'string' && fromArgs.trim()) return fromArgs.trim();
      const fromCtx = context[key];
      return typeof fromCtx === 'string' && fromCtx.trim()
        ? fromCtx.trim()
        : undefined;
    };

    const groupByRaw = args.groupBy ?? context.groupBy;
    const groupBy =
      typeof groupByRaw === 'string' &&
      Object.values(AnalyticsGroupBy).includes(groupByRaw as AnalyticsGroupBy)
        ? (groupByRaw as AnalyticsGroupBy)
        : undefined;

    return {
      companyId: pickString('companyId'),
      clientId: pickString('clientId'),
      campaignId: pickString('campaignId'),
      platformId: pickString('platformId'),
      channelId: pickString('channelId'),
      buyingTypeId: pickString('buyingTypeId'),
      subGroupingId: pickString('subGroupingId'),
      from: pickString('from'),
      to: pickString('to'),
      groupBy,
    };
  }

  private compactMetrics(
    metrics: AnalyticsMetricsResponseDto,
  ): Record<string, unknown> {
    return {
      groupBy: metrics.groupBy,
      from: metrics.from,
      to: metrics.to,
      totals: this.compactBlock(metrics.totals),
      breakdown: metrics.breakdown
        .slice(0, MAX_BREAKDOWN_ROWS)
        .map((row) => this.compactBlock(row)),
      breakdownTruncated: metrics.breakdown.length > MAX_BREAKDOWN_ROWS,
      series: metrics.series
        .slice(0, MAX_SERIES_ROWS)
        .map((row) => this.compactBlock(row)),
      seriesTruncated: metrics.series.length > MAX_SERIES_ROWS,
    };
  }

  private compactBlock(block: MetricBlockDto): Record<string, unknown> {
    return {
      key: block.key,
      label: block.label,
      date: block.date,
      impressions: block.impressions,
      cost: block.cost,
      clicks: block.clicks,
      videoViews: block.videoViews,
      videoViews100p: block.videoViews100p,
      engagement: block.engagement,
      cpm: block.cpm,
      cpc: block.cpc,
      cpvc: block.cpvc,
      cpe: block.cpe,
      ctr: block.ctr,
      vtr: block.vtr,
      vtrc: block.vtrc,
      er: block.er,
    };
  }
}
