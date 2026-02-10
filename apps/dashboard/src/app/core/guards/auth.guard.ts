import { inject } from '@angular/core';
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';

/**
 * Route guard that prevents unauthenticated users from accessing protected
 * routes. When authentication fails the user is redirected to `/login` with
 * a `returnUrl` query parameter so they can be sent back after logging in.
 *
 * Usage in route config:
 * ```
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   component: DashboardComponent,
 * }
 * ```
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Preserve the originally requested URL so the login page can redirect
  // the user back after a successful authentication.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
