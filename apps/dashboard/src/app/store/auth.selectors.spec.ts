import {
  selectAuthState,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from './auth.selectors';
import { AuthState } from './auth.reducer';

describe('authSelectors', () => {
  const initialState: AuthState = {
    user: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', roleId: 'r1', organizationId: 'o1', createdAt: '', updatedAt: '' },
    token: 'jwt-token',
    isAuthenticated: true,
    loading: false,
    error: null,
  };

  it('selectAuthState should return auth state', () => {
    const rootState = { auth: initialState };
    expect(selectAuthState(rootState)).toEqual(initialState);
  });

  it('selectUser should return user', () => {
    expect(selectUser.projector(initialState)).toEqual(initialState.user);
  });

  it('selectToken should return token', () => {
    expect(selectToken.projector(initialState)).toBe('jwt-token');
  });

  it('selectIsAuthenticated should return isAuthenticated', () => {
    expect(selectIsAuthenticated.projector(initialState)).toBe(true);
    expect(selectIsAuthenticated.projector({ ...initialState, isAuthenticated: false })).toBe(false);
  });

  it('selectAuthLoading should return loading', () => {
    expect(selectAuthLoading.projector(initialState)).toBe(false);
    expect(selectAuthLoading.projector({ ...initialState, loading: true })).toBe(true);
  });

  it('selectAuthError should return error', () => {
    expect(selectAuthError.projector(initialState)).toBeNull();
    expect(selectAuthError.projector({ ...initialState, error: 'Failed' })).toBe('Failed');
  });
});
