import type { TaskView } from '@task-management-system/data';
import { Task } from '../task.entity';

export class TaskResponseDto implements TaskView {
  id: string;
  title: string;
  description: string | null;
  status: TaskView['status'];
  category: TaskView['category'];
  priority: TaskView['priority'];
  order: number;
  ownerId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  /** Present when task is loaded with owner relation */
  ownerEmail?: string;
  ownerFirstName?: string;
  ownerLastName?: string;

  static fromEntity(task: Task): TaskResponseDto {
    const dto = new TaskResponseDto();
    dto.id = task.id;
    dto.title = task.title;
    dto.description = task.description;
    dto.status = task.status;
    dto.category = task.category;
    dto.priority = task.priority;
    dto.order = task.order;
    dto.ownerId = task.ownerId;
    dto.organizationId = task.organizationId;
    dto.createdAt = task.createdAt;
    dto.updatedAt = task.updatedAt;
    if (task.owner) {
      dto.ownerEmail = task.owner.email;
      dto.ownerFirstName = task.owner.firstName;
      dto.ownerLastName = task.owner.lastName;
    }
    return dto;
  }
}
