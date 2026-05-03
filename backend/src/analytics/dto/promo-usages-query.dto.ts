import { IsIn, IsOptional } from 'class-validator';
import { BaseAnalyticsQueryDto } from './base-analytics-query.dto';

export class PromoUsagesQueryDto extends BaseAnalyticsQueryDto {
  @IsOptional()
  @IsIn(['appliedAt', 'promocodeCode', 'userEmail', 'discountAmount'])
  sortBy?: 'appliedAt' | 'promocodeCode' | 'userEmail' | 'discountAmount' =
    'appliedAt';
}
