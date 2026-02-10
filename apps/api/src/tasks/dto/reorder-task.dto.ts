import {
  IsInt,
  Min,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderTaskDto {
  /** Target index in the column (0 = first, 1 = second, ...). Request: "put this task at this position." */
  @Type(() => Number)
  @IsInt({ message: 'Order must be an integer' })
  @Min(0, { message: 'Order must be 0 or greater' })
  @IsNotEmpty({ message: 'Order is required' })
  order: number;

  /** Optional: current index of the task in the column. Backend uses this to verify and to know "from" position. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  previousIndex?: number;
}
