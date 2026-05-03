import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { PromoUsagesQueryDto } from './dto/promo-usages-query.dto';
import { PromocodesAnalyticsQueryDto } from './dto/promocodes-analytics-query.dto';
import { UsersAnalyticsQueryDto } from './dto/users-analytics-query.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('users')
  getUsersAnalytics(@Query() query: UsersAnalyticsQueryDto) {
    return this.analyticsService.getUsersAnalytics(query);
  }

  @Get('promocodes')
  getPromocodesAnalytics(@Query() query: PromocodesAnalyticsQueryDto) {
    return this.analyticsService.getPromocodesAnalytics(query);
  }

  @Get('promo-usages')
  getPromoUsages(@Query() query: PromoUsagesQueryDto) {
    return this.analyticsService.getPromoUsages(query);
  }
}
