import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsDailyMetrics } from './ads-daily-metrics.entity';
import { AnalyticsChatService } from './analytics-chat.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdsDailyMetrics])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsChatService],
})
export class AnalyticsModule {}
