import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Platform-only daily facts landed from ETL gold (no Binder FKs).
 * Bridge enrichment happens at query time in AnalyticsService.
 */
@Entity({ schema: 'analytics', name: 'ads_daily_metrics' })
@Index('IDX_ads_daily_metrics_platform_account_date', [
  'platform',
  'adAccountId',
  'date',
])
@Index('IDX_ads_daily_metrics_platform_campaign_date', [
  'platform',
  'campaignId',
  'date',
])
@Index('IDX_ads_daily_metrics_platform_ad_group_date', [
  'platform',
  'adGroupId',
  'date',
])
@Index('IDX_ads_daily_metrics_date', ['date'])
export class AdsDailyMetrics {
  @PrimaryColumn({ name: 'platform', type: 'character varying', length: 64 })
  platform: string;

  @PrimaryColumn({ name: 'ad_id', type: 'character varying', length: 255 })
  adId: string;

  @PrimaryColumn({ name: 'date', type: 'date' })
  date: string;

  @Column({
    name: 'ad_account_id',
    type: 'character varying',
    length: 255,
  })
  adAccountId: string;

  @Column({
    name: 'ad_account_name',
    type: 'character varying',
    length: 512,
    nullable: true,
  })
  adAccountName?: string | null;

  @Column({
    name: 'campaign_id',
    type: 'character varying',
    length: 255,
  })
  campaignId: string;

  @Column({
    name: 'campaign_name',
    type: 'character varying',
    length: 512,
    nullable: true,
  })
  campaignName?: string | null;

  @Column({
    name: 'campaign_status',
    type: 'character varying',
    length: 255,
    nullable: true,
  })
  campaignStatus?: string | null;

  @Column({
    name: 'campaign_operation_status',
    type: 'character varying',
    length: 255,
    nullable: true,
  })
  campaignOperationStatus?: string | null;

  @Column({
    name: 'objective_type',
    type: 'character varying',
    length: 255,
    nullable: true,
  })
  objectiveType?: string | null;

  @Column({
    name: 'budget',
    type: 'numeric',
    precision: 18,
    scale: 4,
    nullable: true,
  })
  budget?: string | null;

  @Column({
    name: 'ad_group_id',
    type: 'character varying',
    length: 255,
  })
  adGroupId: string;

  @Column({
    name: 'optimization_goal',
    type: 'character varying',
    length: 255,
    nullable: true,
  })
  optimizationGoal?: string | null;

  @Column({
    name: 'billing_event',
    type: 'character varying',
    length: 255,
    nullable: true,
  })
  billingEvent?: string | null;

  @Column({
    name: 'ad_name',
    type: 'character varying',
    length: 512,
    nullable: true,
  })
  adName?: string | null;

  @Column({ name: 'ad_text', type: 'text', nullable: true })
  adText?: string | null;

  @Column({
    name: 'display_name',
    type: 'character varying',
    length: 512,
    nullable: true,
  })
  displayName?: string | null;

  @Column({ name: 'conversions', type: 'integer', nullable: true })
  conversions?: number | null;

  @Column({ name: 'clicks', type: 'integer', nullable: true })
  clicks?: number | null;

  @Column({ name: 'engagement', type: 'integer', nullable: true })
  engagement?: number | null;

  @Column({ name: 'impressions', type: 'bigint', nullable: true })
  impressions?: string | null;

  @Column({
    name: 'spend',
    type: 'numeric',
    precision: 18,
    scale: 4,
    nullable: true,
  })
  spend?: string | null;

  @Column({ name: 'purchase', type: 'integer', nullable: true })
  purchase?: number | null;

  @Column({ name: 'shares', type: 'integer', nullable: true })
  shares?: number | null;

  @Column({ name: 'comments', type: 'integer', nullable: true })
  comments?: number | null;

  @Column({ name: 'complete_payment', type: 'integer', nullable: true })
  completePayment?: number | null;

  @Column({ name: 'clicks_on_music_disc', type: 'integer', nullable: true })
  clicksOnMusicDisc?: number | null;

  @Column({ name: 'profile_visits', type: 'integer', nullable: true })
  profileVisits?: number | null;

  @Column({
    name: 'total_app_event_add_to_cart',
    type: 'integer',
    nullable: true,
  })
  totalAppEventAddToCart?: number | null;

  @Column({ name: 'registration', type: 'integer', nullable: true })
  registration?: number | null;

  @Column({ name: 'sales_lead', type: 'integer', nullable: true })
  salesLead?: number | null;

  @Column({ name: 'onsite_shopping', type: 'integer', nullable: true })
  onsiteShopping?: number | null;

  @Column({ name: 'video_views_2s', type: 'integer', nullable: true })
  videoViews2s?: number | null;

  @Column({ name: 'video_views_6s', type: 'integer', nullable: true })
  videoViews6s?: number | null;

  @Column({ name: 'video_views_25p', type: 'integer', nullable: true })
  videoViews25p?: number | null;

  @Column({ name: 'video_views_50p', type: 'integer', nullable: true })
  videoViews50p?: number | null;

  @Column({ name: 'video_views_75p', type: 'integer', nullable: true })
  videoViews75p?: number | null;

  @Column({ name: 'video_views_100p', type: 'integer', nullable: true })
  videoViews100p?: number | null;

  @Column({ name: 'video_views', type: 'integer', nullable: true })
  videoViews?: number | null;

  @Column({ name: 'reach', type: 'integer', nullable: true })
  reach?: number | null;
}
