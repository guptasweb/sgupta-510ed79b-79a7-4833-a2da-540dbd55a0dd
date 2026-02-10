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
 * Route guard that prevents *authenticated* users from accessing public-only
 * routes such as `/login`. If the user already has a valid
 * token they are redirected to the dashboard (or whichever root route is
 * configured).
 *
 * Usage in route config:
 * ```
 * {
 *   path: 'login',
 *   canActivate: [noAuthGuard],
 *   component: LoginComponent,
 * }
 * ```
 */
export const noAuthGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Already authenticated -- send them to the main app.
  return router.createUrlTree(['/dashboard']);
};
