import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState } from './tasks.reducer';

export const selectTasksState = createFeatureSelector<TasksState>('tasks');

export const selectTasks = createSelector(
  selectTasksState,
  (state: TasksState) => state.tasks
);

export const selectTasksLoading = createSelector(
  selectTasksState,
  (state: TasksState) => state.loading
);

export const selectTasksError = createSelector(
  selectTasksState,
  (state: TasksState) => state.error
);

export const selectTasksFilters = createSelector(
  selectTasksState,
  (state: TasksState) => state.filters
);

export const selectTaskListSort = createSelector(
  selectTasksState,
  (state: TasksState) => state.sort
);

export const selectTasksTotal = createSelector(
  selectTasksState,
  (state: TasksState) => state.totalTasks
);

export const selectTasksPage = createSelector(
  selectTasksState,
  (state: TasksState) => state.page
);

export const selectTasksLimit = createSelector(
  selectTasksState,
  (state: TasksState) => state.limit
);
