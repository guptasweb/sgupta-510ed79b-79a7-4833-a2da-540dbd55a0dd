import { ActionReducerMap } from '@ngrx/store';
import { AuthState, authReducer } from './auth.reducer';
import { TasksState, tasksReducer } from './tasks.reducer';

export interface AppState {
  auth: AuthState;
  tasks: TasksState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  tasks: tasksReducer,
};

// Re-export repositories
export { AuthRepository, IAuthState } from './auth.repository';
export { TasksRepository, ITasksState } from './tasks.repository';

// Re-export NgRx actions
export * as AuthActions from './auth.actions';
export * as TasksActions from './tasks.actions';

// Re-export NgRx reducers
export { authReducer, AuthState } from './auth.reducer';
export { tasksReducer, TasksState } from './tasks.reducer';

// Re-export NgRx selectors
export * as AuthSelectors from './auth.selectors';
export * as TasksSelectors from './tasks.selectors';
