import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnalyticsAdsDailyMetrics1785100000000
  implements MigrationInterface
{
  name = 'AnalyticsAdsDailyMetrics1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "analytics"`);
    await queryRunner.query(`
      CREATE TABLE "analytics"."ads_daily_metrics" (
        "platform" character varying(64) NOT NULL,
        "ad_id" character varying(255) NOT NULL,
        "date" date NOT NULL,
        "ad_account_id" character varying(255) NOT NULL,
        "ad_account_name" character varying(512),
        "campaign_id" character varying(255) NOT NULL,
        "campaign_name" character varying(512),
        "campaign_status" character varying(255),
        "campaign_operation_status" character varying(255),
        "objective_type" character varying(255),
        "budget" numeric(18,4),
        "ad_group_id" character varying(255) NOT NULL,
        "optimization_goal" character varying(255),
        "billing_event" character varying(255),
        "ad_name" character varying(512),
        "ad_text" text,
        "display_name" character varying(512),
        "conversions" integer,
        "clicks" integer,
        "engagement" integer,
        "impressions" bigint,
        "spend" numeric(18,4),
        "purchase" integer,
        "shares" integer,
        "comments" integer,
        "complete_payment" integer,
        "clicks_on_music_disc" integer,
        "profile_visits" integer,
        "total_app_event_add_to_cart" integer,
        "registration" integer,
        "sales_lead" integer,
        "onsite_shopping" integer,
        "video_views_2s" integer,
        "video_views_6s" integer,
        "video_views_25p" integer,
        "video_views_50p" integer,
        "video_views_75p" integer,
        "video_views_100p" integer,
        "video_views" integer,
        "reach" integer,
        CONSTRAINT "PK_ads_daily_metrics" PRIMARY KEY ("platform", "ad_id", "date")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ads_daily_metrics_platform_account_date"
      ON "analytics"."ads_daily_metrics" ("platform", "ad_account_id", "date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ads_daily_metrics_platform_campaign_date"
      ON "analytics"."ads_daily_metrics" ("platform", "campaign_id", "date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ads_daily_metrics_platform_ad_group_date"
      ON "analytics"."ads_daily_metrics" ("platform", "ad_group_id", "date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ads_daily_metrics_date"
      ON "analytics"."ads_daily_metrics" ("date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "analytics"."ads_daily_metrics"`,
    );
    await queryRunner.query(`DROP SCHEMA IF EXISTS "analytics"`);
  }
}
