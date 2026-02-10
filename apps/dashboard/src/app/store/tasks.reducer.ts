import { createReducer, on } from '@ngrx/store';
import * as TasksActions from './tasks.actions';
import { Task, TaskFilters } from '../shared/models';

export type TaskListSortField = 'date' | 'priority' | 'status';
export type TaskListSortDirection = 'asc' | 'desc';

export interface TaskListSort {
  sortField: TaskListSortField;
  sortDirection: TaskListSortDirection;
}

export interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
  /** Persisted so sort selection survives navigation (e.g. tasks -> audit -> tasks). */
  sort: TaskListSort;
  /** List response metadata (from loadTasksSuccess). */
  totalTasks: number;
  page: number;
  limit: number;
}

const defaultSort: TaskListSort = { sortField: 'date', sortDirection: 'desc' };

export const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
  filters: {},
  sort: defaultSort,
  totalTasks: 0,
  page: 1,
  limit: 10,
};

export const tasksReducer = createReducer(
  initialState,
  on(TasksActions.loadTasksRequest, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TasksActions.loadTasksSuccess, (state, { tasks, total, page, limit }) => ({
    ...state,
    tasks,
    loading: false,
    error: null,
    totalTasks: total,
    page,
    limit,
  })),
  on(TasksActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(TasksActions.createTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
  })),
  on(TasksActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
  })),
  on(TasksActions.updateTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks: state.tasks.map((t) => {
      const u = tasks.find((x) => x.id === t.id);
      return u ?? t;
    }),
  })),
  on(TasksActions.deleteTaskSuccess, (state, { taskId }) => ({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== taskId),
  })),
  on(TasksActions.setFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters },
  })),
  on(TasksActions.clearFilters, (state) => ({
    ...state,
    filters: {},
  })),
  on(TasksActions.setSort, (state, { sortField, sortDirection }) => ({
    ...state,
    sort: { sortField, sortDirection },
  })),
  on(TasksActions.clearTasks, () => initialState)
);
