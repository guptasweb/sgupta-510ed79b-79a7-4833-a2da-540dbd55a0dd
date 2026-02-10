import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { TaskStatus, TaskCategory, TaskPriority } from '@task-management-system/data';

export class UpdateTaskDto {
  @IsString({ message: 'Title must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string | null;

  @IsEnum(TaskStatus, { message: 'Status must be one of: pending, in-progress, in-review, completed, on-hold' })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskCategory, { message: 'Category must be one of: Work, Personal' })
  @IsOptional()
  category?: TaskCategory | null;

  @IsEnum(TaskPriority, { message: 'Priority must be one of: low, medium, high' })
  @IsOptional()
  priority?: TaskPriority;

  /** Allowed in request for compatibility; ignored by service (task organization is immutable on update). */
  @IsUUID('4', { message: 'Organization ID must be a valid UUID' })
  @IsOptional()
  organizationId?: string;

  // Note: order should not be updated via this DTO - use the reorder endpoint instead
}
