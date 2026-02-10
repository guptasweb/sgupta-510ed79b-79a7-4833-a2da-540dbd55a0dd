import { createAction, props } from '@ngrx/store';
import { Task, TaskFilters } from '../shared/models';

export const loadTasksRequest = createAction('[Tasks] Load Request');

export const loadTasksSuccess = createAction(
  '[Tasks] Load Success',
  props<{ tasks: Task[] }>()
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

export const deleteTaskSuccess = createAction(
  '[Tasks] Delete Success',
  props<{ taskId: string }>()
);

export const setFilters = createAction(
  '[Tasks] Set Filters',
  props<{ filters: TaskFilters }>()
);

export const clearFilters = createAction('[Tasks] Clear Filters');

export const clearTasks = createAction('[Tasks] Clear Tasks');
