import { IsIn, IsOptional } from 'class-validator';
import { BaseAnalyticsQueryDto } from './base-analytics-query.dto';

export class PromocodesAnalyticsQueryDto extends BaseAnalyticsQueryDto {
  @IsOptional()
  @IsIn(['createdAt', 'code', 'usedCount', 'totalRevenue', 'uniqueUsers'])
  sortBy?: 'createdAt' | 'code' | 'usedCount' | 'totalRevenue' | 'uniqueUsers' =
    'createdAt';
}
