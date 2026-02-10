import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Task, TaskFilters } from '../shared/models';
import { AppState } from './index';
import * as TasksActions from './tasks.actions';
import * as TasksSelectors from './tasks.selectors';

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

  // -- Load ------------------------------------------------------------------

  loadTasksRequest(): void {
    this.store.dispatch(TasksActions.loadTasksRequest());
  }

  loadTasksSuccess(tasks: Task[]): void {
    this.store.dispatch(TasksActions.loadTasksSuccess({ tasks }));
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

  // -- Reset -----------------------------------------------------------------

  clearTasks(): void {
    this.store.dispatch(TasksActions.clearTasks());
  }
}
