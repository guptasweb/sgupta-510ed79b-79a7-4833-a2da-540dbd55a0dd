import { createReducer, on } from '@ngrx/store';
import * as TasksActions from './tasks.actions';
import { Task, TaskFilters } from '../shared/models';

export interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
}

export const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
  filters: {},
};

export const tasksReducer = createReducer(
  initialState,
  on(TasksActions.loadTasksRequest, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
    error: null,
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
  on(TasksActions.clearTasks, () => initialState)
);
