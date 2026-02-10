import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Task, TaskFilters } from '../shared/models';
import { AppState } from './index';
import * as TasksActions from './tasks.actions';
import * as TasksSelectors from './tasks.selectors';
import type { TaskListSort } from './tasks.reducer';

// Legacy interface for backward compatibility
export interface ITasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
}

// ---------------------------------------------------------------------------
// Repository (injectable NgRx Store wrapper)
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class TasksRepository {
  constructor(private store: Store<AppState>) {}

  get tasks$(): Observable<Task[]> {
    return this.store.select(TasksSelectors.selectTasks);
  }

  get loading$(): Observable<boolean> {
    return this.store.select(TasksSelectors.selectTasksLoading);
  }

  get error$(): Observable<string | null> {
    return this.store.select(TasksSelectors.selectTasksError);
  }

  get filters$(): Observable<TaskFilters> {
    return this.store.select(TasksSelectors.selectTasksFilters);
  }

  get sort$(): Observable<TaskListSort> {
    return this.store.select(TasksSelectors.selectTaskListSort);
  }

  get totalTasks$(): Observable<number> {
    return this.store.select(TasksSelectors.selectTasksTotal);
  }

  get page$(): Observable<number> {
    return this.store.select(TasksSelectors.selectTasksPage);
  }

  get limit$(): Observable<number> {
    return this.store.select(TasksSelectors.selectTasksLimit);
  }

  // -- Load ------------------------------------------------------------------

  loadTasksRequest(payload?: { filters?: TaskFilters; page?: number; limit?: number }): void {
    this.store.dispatch(TasksActions.loadTasksRequest(payload ?? {}));
  }

  loadTasksSuccess(tasks: Task[], total: number, page: number, limit: number): void {
    this.store.dispatch(TasksActions.loadTasksSuccess({ tasks, total, page, limit }));
  }

  loadTasksFailure(error: string): void {
    this.store.dispatch(TasksActions.loadTasksFailure({ error }));
  }

  // -- Create ----------------------------------------------------------------

  createTaskSuccess(task: Task): void {
    this.store.dispatch(TasksActions.createTaskSuccess({ task }));
  }

  // -- Update ----------------------------------------------------------------

  updateTaskSuccess(task: Task): void {
    this.store.dispatch(TasksActions.updateTaskSuccess({ task }));
  }

  /** Update multiple tasks in place (e.g. after reorder so column order is correct). */
  updateTasksSuccess(tasks: Task[]): void {
    this.store.dispatch(TasksActions.updateTasksSuccess({ tasks }));
  }

  // -- Delete ----------------------------------------------------------------

  deleteTaskSuccess(taskId: string): void {
    this.store.dispatch(TasksActions.deleteTaskSuccess({ taskId }));
  }

  // -- Filters ---------------------------------------------------------------

  setFilters(filters: TaskFilters): void {
    this.store.dispatch(TasksActions.setFilters({ filters }));
  }

  clearFilters(): void {
    this.store.dispatch(TasksActions.clearFilters());
  }

  setSort(sortField: TaskListSort['sortField'], sortDirection: TaskListSort['sortDirection']): void {
    this.store.dispatch(TasksActions.setSort({ sortField, sortDirection }));
  }

  // -- Reset -----------------------------------------------------------------

  clearTasks(): void {
    this.store.dispatch(TasksActions.clearTasks());
  }
}
