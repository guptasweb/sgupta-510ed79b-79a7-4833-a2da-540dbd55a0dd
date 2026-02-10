import {
  IsOptional,
  IsUUID,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterAuditLogDto {
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsOptional()
  userId?: string;

  @IsString({ message: 'Action must be a string' })
  @IsOptional()
  action?: string;

  @IsString({ message: 'Resource must be a string' })
  @IsOptional()
  resource?: string;

  @IsUUID('4', { message: 'Resource ID must be a valid UUID' })
  @IsOptional()
  resourceId?: string;

  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  @IsOptional()
  endDate?: string;

  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  @IsOptional()
  limit?: number = 10;
}
