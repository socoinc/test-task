import { IsString, MinLength } from 'class-validator';

export class ApplyPromocodeDto {
  @IsString()
  @MinLength(3)
  code: string;
}
