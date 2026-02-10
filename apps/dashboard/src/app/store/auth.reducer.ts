import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from '../shared/models';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem('token');

export const initialState: AuthState = {
  user: null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.loginRequest, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, (state, { user, token }) => {
    localStorage.setItem('token', token);
    return {
      ...state,
      user,
      token,
      isAuthenticated: true,
      loading: false,
      error: null,
    };
  }),
  on(AuthActions.loginFailure, (state, { error }) => {
    localStorage.removeItem('token');
    return {
      ...state,
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error,
    };
  }),
  on(AuthActions.logout, (state) => {
    localStorage.removeItem('token');
    return {
      ...state,
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }),
  on(AuthActions.setUser, (state, { user }) => ({
    ...state,
    user,
  }))
);
