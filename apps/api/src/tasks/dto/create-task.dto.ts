import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { TaskStatus, TaskCategory, TaskPriority } from '@task-management-system/data';

export class CreateTaskDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

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

  @IsUUID('4', { message: 'Organization ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId: string;
}
