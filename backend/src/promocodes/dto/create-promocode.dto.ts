import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePromocodeDto {
  @IsString()
  @MinLength(3)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalUsageLimit: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserUsageLimit: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
