import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskCategory, TaskPriority } from '@task-management-system/data';

export class FilterTaskDto {
  @IsEnum(TaskStatus, { message: 'Status must be one of: pending, in-progress, in-review, completed, on-hold' })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskCategory, { message: 'Category must be one of: Work, Personal' })
  @IsOptional()
  category?: TaskCategory;

  @IsEnum(TaskPriority, { message: 'Priority must be one of: low, medium, high' })
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID('4', { message: 'Owner ID must be a valid UUID' })
  @IsOptional()
  ownerId?: string;

  @IsUUID('4', { message: 'Organization ID must be a valid UUID' })
  @IsOptional()
  organizationId?: string;

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
