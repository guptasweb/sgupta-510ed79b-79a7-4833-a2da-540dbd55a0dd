/**
 * Task types from shared lib. Re-export for convenience so feature code
 * can keep importing from shared/models/task.model.
 */
import {
  TaskStatus,
  TaskCategory,
  TaskPriority,
  TaskView,
  TaskFilters,
} from '@task-management-system/data';

export { TaskStatus, TaskCategory, TaskPriority };
export type { TaskFilters };

/** Alias for TaskView; dashboard uses string dates. */
export type Task = Omit<TaskView, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};
