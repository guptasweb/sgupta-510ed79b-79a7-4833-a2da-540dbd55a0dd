import { createAction, props } from '@ngrx/store';
import { User } from '../shared/models';

export const loginRequest = createAction('[Auth] Login Request');

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');

export const setUser = createAction(
  '[Auth] Set User',
  props<{ user: User }>()
);
