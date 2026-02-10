import { createAction, props } from '@ngrx/store';
import { Task, TaskFilters } from '../shared/models';

export const loadTasksRequest = createAction(
  '[Tasks] Load Request',
  props<{ filters?: TaskFilters; page?: number; limit?: number }>()
);

export const loadTasksSuccess = createAction(
  '[Tasks] Load Success',
  props<{ tasks: Task[]; total: number; page: number; limit: number }>()
);

export const loadTasksFailure = createAction(
  '[Tasks] Load Failure',
  props<{ error: string }>()
);

export const createTaskSuccess = createAction(
  '[Tasks] Create Success',
  props<{ task: Task }>()
);

export const updateTaskSuccess = createAction(
  '[Tasks] Update Success',
  props<{ task: Task }>()
);

/** Update multiple tasks (e.g. after reorder so all tasks in the column get new order). */
export const updateTasksSuccess = createAction(
  '[Tasks] Update Many Success',
  props<{ tasks: Task[] }>()
);

export const deleteTaskSuccess = createAction(
  '[Tasks] Delete Success',
  props<{ taskId: string }>()
);

export const setFilters = createAction(
  '[Tasks] Set Filters',
  props<{ filters: TaskFilters }>()
);

export const clearFilters = createAction('[Tasks] Clear Filters');

export const setSort = createAction(
  '[Tasks] Set Sort',
  props<{ sortField: 'date' | 'priority' | 'status'; sortDirection: 'asc' | 'desc' }>()
);

export const clearTasks = createAction('[Tasks] Clear Tasks');
