import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../shared/models';
import { AppState } from './index';
import * as AuthActions from './auth.actions';
import * as AuthSelectors from './auth.selectors';

// Legacy interface for backward compatibility
export interface IAuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Repository (injectable NgRx Store wrapper)
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  readonly user$: Observable<User | null>;
  readonly token$: Observable<string | null>;
  readonly isAuthenticated$: Observable<boolean>;
  readonly loading$: Observable<boolean>;
  readonly error$: Observable<string | null>;

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.token$ = this.store.select(AuthSelectors.selectToken);
    this.isAuthenticated$ = this.store.select(
      AuthSelectors.selectIsAuthenticated
    );
    this.loading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
  }

  // -- Actions ---------------------------------------------------------------

  loginRequest(): void {
    this.store.dispatch(AuthActions.loginRequest());
  }

  loginSuccess(user: User, token: string): void {
    this.store.dispatch(AuthActions.loginSuccess({ user, token }));
  }

  loginFailure(error: string): void {
    this.store.dispatch(AuthActions.loginFailure({ error }));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  setUser(user: User): void {
    this.store.dispatch(AuthActions.setUser({ user }));
  }
}
