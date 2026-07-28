import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { UserSignature } from 'src/access/auth/userSignature.type';
import { Role } from 'src/shared/role.enum';
import {
  AnalyticsGroupBy,
  AnalyticsMetricsQueryDto,
  AnalyticsMetricsResponseDto,
  MetricBlockDto,
} from './analytics.dto';

type AggRow = {
  group_key: string | null;
  group_label: string | null;
  impressions: string | number | null;
  cost: string | number | null;
  clicks: string | number | null;
  video_views: string | number | null;
  video_views_100p: string | number | null;
  engagement: string | number | null;
};

const FILTER_CHAIN: Array<{
  filter: keyof AnalyticsMetricsQueryDto;
  nextGroupBy: AnalyticsGroupBy;
}> = [
  { filter: 'companyId', nextGroupBy: AnalyticsGroupBy.Client },
  { filter: 'clientId', nextGroupBy: AnalyticsGroupBy.Campaign },
  { filter: 'campaignId', nextGroupBy: AnalyticsGroupBy.Platform },
  { filter: 'platformId', nextGroupBy: AnalyticsGroupBy.Channel },
  { filter: 'channelId', nextGroupBy: AnalyticsGroupBy.BuyingType },
  { filter: 'buyingTypeId', nextGroupBy: AnalyticsGroupBy.SubGrouping },
  { filter: 'subGroupingId', nextGroupBy: AnalyticsGroupBy.Date },
];

@Injectable()
export class AnalyticsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getMetrics(
    query: AnalyticsMetricsQueryDto,
    caller: UserSignature,
  ): Promise<AnalyticsMetricsResponseDto> {
    this.assertCompanyAccess(query.companyId, caller);

    const from = query.from ?? this.defaultFrom();
    const to = query.to ?? this.defaultTo();
    if (from > to) {
      throw new BadRequestException("'from' must be on or before 'to'");
    }

    const groupBy = query.groupBy ?? this.resolveAutoGroupBy(query);
    const needsSubGroupingDim = groupBy === AnalyticsGroupBy.SubGrouping;

    const params: unknown[] = [from, to];
    const where: string[] = ['f.date >= $1::date', 'f.date <= $2::date'];

    this.appendAclAndFilters(where, params, query, caller);

    const baseFrom = this.buildFromSql({
      joinSubGrouping: needsSubGroupingDim,
    });

    const totalsSql = `
      SELECT
        NULL::text AS group_key,
        NULL::text AS group_label,
        ${this.metricSelectSql()}
      ${baseFrom}
      WHERE ${where.join(' AND ')}
    `;

    const seriesSql = `
      SELECT
        f.date::text AS group_key,
        f.date::text AS group_label,
        ${this.metricSelectSql()}
      ${baseFrom}
      WHERE ${where.join(' AND ')}
      GROUP BY f.date
      ORDER BY f.date ASC
    `;

    const totalsRows = await this.dataSource.query(totalsSql, params);
    const seriesRows = await this.dataSource.query(seriesSql, params);

    let breakdown: MetricBlockDto[] = [];
    if (groupBy !== AnalyticsGroupBy.Date) {
      const breakdownFrom = this.buildFromSql({
        joinSubGrouping: needsSubGroupingDim,
      });
      const dim = this.groupBySql(groupBy);
      const breakdownSql = `
        SELECT
          ${dim.keyExpr} AS group_key,
          ${dim.labelExpr} AS group_label,
          ${this.metricSelectSql()}
        ${breakdownFrom}
        WHERE ${where.join(' AND ')}
          AND ${dim.keyExpr} IS NOT NULL
        GROUP BY ${dim.keyExpr}, ${dim.labelExpr}
        ORDER BY SUM(COALESCE(f.spend, 0)) DESC
      `;
      const breakdownRows = await this.dataSource.query(breakdownSql, params);
      breakdown = breakdownRows.map((row: AggRow) => this.toMetricBlock(row));
    }

    return {
      groupBy,
      from,
      to,
      totals: this.toMetricBlock(totalsRows[0] ?? {}),
      series: seriesRows.map((row: AggRow) => ({
        ...this.toMetricBlock(row),
        date: row.group_key ?? undefined,
      })),
      breakdown,
    };
  }

  resolveAutoGroupBy(query: AnalyticsMetricsQueryDto): AnalyticsGroupBy {
    let groupBy: AnalyticsGroupBy = AnalyticsGroupBy.Company;
    for (const step of FILTER_CHAIN) {
      const value = query[step.filter];
      if (typeof value === 'string' && value.length > 0) {
        groupBy = step.nextGroupBy;
      } else {
        break;
      }
    }
    return groupBy;
  }

  private buildFromSql(opts: { joinSubGrouping: boolean }): string {
    const subGroupingJoin = opts.joinSubGrouping
      ? `
      INNER JOIN platform_object_map_sub_grouping pom_sg
        ON pom_sg.platform_object_map_id = map_ag.id
      INNER JOIN sub_grouping sg
        ON sg.id = pom_sg.sub_grouping_id
      `
      : '';

    return `
      FROM analytics.ads_daily_metrics f
      INNER JOIN platform_account pa
        ON pa.external_account_id = f.ad_account_id
       AND pa.is_active = true
      INNER JOIN platform p
        ON p.id = pa.platform_id
       AND p.catalog_key = f.platform
      INNER JOIN client cl
        ON cl.id = pa.client_id
      INNER JOIN company co
        ON co.id = cl.company_id
      LEFT JOIN platform_object_map map_c
        ON map_c.platform_account_id = pa.id
       AND map_c.object_type = 'campaign'::platform_object_map_object_type_enum
       AND map_c.external_id = f.campaign_id
       AND map_c.is_active = true
      LEFT JOIN platform_object_map map_ag
        ON map_ag.platform_account_id = pa.id
       AND map_ag.object_type = 'ad_group'::platform_object_map_object_type_enum
       AND map_ag.external_id = f.ad_group_id
       AND map_ag.is_active = true
      LEFT JOIN platform_object_map map_ad
        ON map_ad.platform_account_id = pa.id
       AND map_ad.object_type = 'ad'::platform_object_map_object_type_enum
       AND map_ad.external_id = f.ad_id
       AND map_ad.is_active = true
      LEFT JOIN channel ch
        ON ch.id = map_c.channel_id
      LEFT JOIN buying_type bt
        ON bt.id = map_c.buying_type_id
      LEFT JOIN campaign camp
        ON camp.id = COALESCE(map_ad.campaign_id, map_ag.campaign_id, map_c.campaign_id)
      ${subGroupingJoin}
    `;
  }

  private appendAclAndFilters(
    where: string[],
    params: unknown[],
    query: AnalyticsMetricsQueryDto,
    caller: UserSignature,
  ): void {
    where.push(
      'COALESCE(map_ad.campaign_id, map_ag.campaign_id, map_c.campaign_id) IS NOT NULL',
    );

    if (caller.role !== Role.Superadmin) {
      if (caller.companyIds.length === 0) {
        where.push('FALSE');
        return;
      }
      params.push(caller.companyIds);
      where.push(`co.id = ANY($${params.length}::uuid[])`);
    }

    const filters: Array<[string | undefined, string]> = [
      [query.companyId, 'co.id'],
      [query.clientId, 'cl.id'],
      [query.campaignId, 'camp.id'],
      [query.platformId, 'p.id'],
      [query.channelId, 'map_c.channel_id'],
      [query.buyingTypeId, 'map_c.buying_type_id'],
    ];

    for (const [value, column] of filters) {
      if (!value) continue;
      params.push(value);
      where.push(`${column} = $${params.length}::uuid`);
    }

    if (query.subGroupingId) {
      params.push(query.subGroupingId);
      where.push(`EXISTS (
        SELECT 1
        FROM platform_object_map_sub_grouping pom_sg_f
        WHERE pom_sg_f.platform_object_map_id = map_ag.id
          AND pom_sg_f.sub_grouping_id = $${params.length}::uuid
      )`);
    }
  }

  private groupBySql(groupBy: AnalyticsGroupBy): {
    keyExpr: string;
    labelExpr: string;
  } {
    switch (groupBy) {
      case AnalyticsGroupBy.Company:
        return { keyExpr: 'co.id::text', labelExpr: 'co.name' };
      case AnalyticsGroupBy.Client:
        return { keyExpr: 'cl.id::text', labelExpr: 'cl.name' };
      case AnalyticsGroupBy.Campaign:
        return { keyExpr: 'camp.id::text', labelExpr: 'camp.name' };
      case AnalyticsGroupBy.Platform:
        return { keyExpr: 'p.id::text', labelExpr: 'p.name' };
      case AnalyticsGroupBy.Channel:
        return { keyExpr: 'ch.id::text', labelExpr: 'ch.name' };
      case AnalyticsGroupBy.BuyingType:
        return { keyExpr: 'bt.id::text', labelExpr: 'bt.name' };
      case AnalyticsGroupBy.SubGrouping:
        return { keyExpr: 'sg.id::text', labelExpr: 'sg.name' };
      default:
        return { keyExpr: 'f.date::text', labelExpr: 'f.date::text' };
    }
  }

  private metricSelectSql(): string {
    return `
      COALESCE(SUM(f.impressions), 0)::bigint AS impressions,
      COALESCE(SUM(f.spend), 0)::numeric AS cost,
      COALESCE(SUM(f.clicks), 0)::bigint AS clicks,
      COALESCE(SUM(f.video_views), 0)::bigint AS video_views,
      COALESCE(SUM(f.video_views_100p), 0)::bigint AS video_views_100p,
      COALESCE(SUM(f.engagement), 0)::bigint AS engagement
    `;
  }

  private toMetricBlock(row: Partial<AggRow>): MetricBlockDto {
    const impressions = this.toNumber(row.impressions);
    const cost = this.toNumber(row.cost);
    const clicks = this.toNumber(row.clicks);
    const videoViews = this.toNumber(row.video_views);
    const videoViews100p = this.toNumber(row.video_views_100p);
    const engagement = this.toNumber(row.engagement);

    return {
      key: row.group_key ?? undefined,
      label: row.group_label ?? undefined,
      impressions,
      cost,
      clicks,
      videoViews,
      videoViews100p,
      engagement,
      cpm: this.safeDiv(cost * 1000, impressions),
      cpc: this.safeDiv(cost, clicks),
      cpvc: this.safeDiv(cost, videoViews100p),
      cpe: this.safeDiv(cost, engagement),
      ctr: this.safeDiv(clicks, impressions),
      vtrc: this.safeDiv(videoViews100p, impressions),
      er: this.safeDiv(engagement, impressions),
    };
  }

  private assertCompanyAccess(
    companyId: string | undefined,
    caller: UserSignature,
  ): void {
    if (!companyId || caller.role === Role.Superadmin) return;
    if (!caller.companyIds.includes(companyId)) {
      throw new ForbiddenException('Sem acesso a esta empresa');
    }
  }

  private safeDiv(numerator: number, denominator: number): number | null {
    if (!denominator) return null;
    return numerator / denominator;
  }

  private toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private defaultTo(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private defaultFrom(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 29);
    return d.toISOString().slice(0, 10);
  }
}
