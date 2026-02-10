/**
 * Task status and category/priority enums shared by API and dashboard.
 * Single source of truth for task domain values.
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  IN_REVIEW = 'in-review',
  COMPLETED = 'completed',
  ON_HOLD = 'on-hold',
}

export enum TaskCategory {
  WORK = 'Work',
  PERSONAL = 'Personal',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
