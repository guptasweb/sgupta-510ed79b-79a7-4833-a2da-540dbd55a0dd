import { authReducer, AuthState, initialState } from './auth.reducer';
import * as AuthActions from './auth.actions';

describe('authReducer', () => {
  const baseState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('should return initial state', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state).toBeDefined();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set loading and clear error on loginRequest', () => {
    const state = authReducer(baseState, AuthActions.loginRequest());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set user, token, isAuthenticated and clear loading on loginSuccess', () => {
    const user = {
      id: 'u1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      roleId: 'r1',
      organizationId: 'o1',
      createdAt: '',
      updatedAt: '',
    };
    const token = 'jwt-token';
    const state = authReducer(
      { ...baseState, loading: true },
      AuthActions.loginSuccess({ user, token })
    );
    expect(state.user).toEqual(user);
    expect(state.token).toBe(token);
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should clear user and set error on loginFailure', () => {
    const state = authReducer(
      { ...baseState, loading: true },
      AuthActions.loginFailure({ error: 'Invalid credentials' })
    );
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('should reset state on logout', () => {
    const state = authReducer(
      {
        ...baseState,
        user: {} as any,
        token: 't',
        isAuthenticated: true,
      },
      AuthActions.logout()
    );
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set user on setUser', () => {
    const user = {
      id: 'u1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      roleId: 'r1',
      organizationId: 'o1',
      createdAt: '',
      updatedAt: '',
    };
    const state = authReducer(
      { ...baseState, user: null },
      AuthActions.setUser({ user })
    );
    expect(state.user).toEqual(user);
  });
});
