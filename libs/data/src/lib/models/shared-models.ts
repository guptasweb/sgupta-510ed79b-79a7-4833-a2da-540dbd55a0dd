/**
 * Re-exports domain enums and view types for use as "models" in the dashboard
 * or other consumers. Keeps a single place for task/user shapes and enums.
 */
export { TaskStatus, TaskCategory, TaskPriority } from './task-enums';
export type { TaskView, TaskFilters, UserView } from '../interfaces/shared-interfaces';
