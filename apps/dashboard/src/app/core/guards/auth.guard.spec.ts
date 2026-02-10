import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authService: jest.Mocked<Pick<AuthService, 'isAuthenticated'>>;
  let createUrlTree: jest.Mock;

  beforeEach(() => {
    authService = { isAuthenticated: jest.fn() };
    createUrlTree = jest.fn().mockReturnValue({ toString: () => '/login' });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: Router,
          useValue: { createUrlTree },
        },
      ],
    });
  });

  it('should allow access when authenticated', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    const route = {} as any;
    const state = { url: '/dashboard' } as any;

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(result).toBe(true);
    expect(createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login with returnUrl when not authenticated', () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    const route = {} as any;
    const state = { url: '/dashboard/settings' } as any;

    const result = TestBed.runInInjectionContext(() =>
      authGuard(route, state)
    );

    expect(createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/dashboard/settings' },
    });
    expect(result).toBeDefined();
  });
});
