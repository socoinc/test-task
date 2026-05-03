import { IsIn, IsOptional } from 'class-validator';
import { BaseAnalyticsQueryDto } from './base-analytics-query.dto';

export class UsersAnalyticsQueryDto extends BaseAnalyticsQueryDto {
  @IsOptional()
  @IsIn([
    'createdAt',
    'name',
    'email',
    'totalOrders',
    'totalSpent',
    'totalDiscount',
  ])
  sortBy?:
    | 'createdAt'
    | 'name'
    | 'email'
    | 'totalOrders'
    | 'totalSpent'
    | 'totalDiscount' = 'createdAt';
}
