import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsSyncService } from './analytics-sync.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsSyncService],
  exports: [AnalyticsService, AnalyticsSyncService],
})
export class AnalyticsModule {}
