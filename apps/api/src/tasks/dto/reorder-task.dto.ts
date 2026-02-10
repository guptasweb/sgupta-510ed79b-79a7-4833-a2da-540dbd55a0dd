import {
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderTaskDto {
  @Type(() => Number)
  @IsInt({ message: 'Order must be an integer' })
  @Min(0, { message: 'Order must be 0 or greater' })
  @IsNotEmpty({ message: 'Order is required' })
  order: number;
}
