import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../../shared/models';
import { AuthRepository } from '../../store/auth.repository';
import { JwtPayload, LoginResponse } from './auth.interfaces';
import { environment } from '../../../environments/environment';

/**
 * Token storage keys used in localStorage.
 */
const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly authRepository: AuthRepository
  ) {
    // On service initialisation, if a stored token exists, decode it and
    // hydrate the Redux store with the current user.
    this.loadStoredUser();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Authenticate a user with email and password.
   *
   * On success the JWT is persisted to localStorage and the Redux store is
   * updated with the decoded user information.
   */
  login(email: string, password: string): Observable<User> {
    this.authRepository.loginRequest();

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          this.storeToken(response.accessToken);
          const user = this.decodeTokenToUser(response.accessToken);
          this.authRepository.loginSuccess(user, response.accessToken);
        }),
        map((response) => this.decodeTokenToUser(response.accessToken)),
        catchError((error: HttpErrorResponse) => {
          const message = this.extractErrorMessage(error);
          this.authRepository.loginFailure(message);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * Log the current user out.
   *
   * Clears the stored token, resets the Redux auth state, and navigates
   * the user to the login page.
   */
  logout(): void {
    this.removeToken();
    this.authRepository.logout();
    void this.router.navigate(['/login']);
  }

  /**
   * Fetch the full user profile from the API using the stored JWT.
   *
   * Useful for re-hydrating the user object with relational data (role name,
   * organisation, etc.) that is not present in the JWT payload.
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      tap((user) => this.authRepository.setUser(user)),
      catchError((error: HttpErrorResponse) => {
        // If the token is invalid / expired the interceptor will handle the
        // 401 redirect, but we still surface the error to subscribers.
        const message = this.extractErrorMessage(error);
        return throwError(() => new Error(message));
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Token helpers
  // ---------------------------------------------------------------------------

  /**
   * Return the raw JWT string stored in localStorage, or `null` if absent.
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Return `true` when a non-expired token exists in storage.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const payload = this.decodeToken(token);
    if (!payload) {
      return false;
    }

    // exp is in seconds; Date.now() returns milliseconds.
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      this.removeToken();
      return false;
    }

    return true;
  }

  /**
   * Decode the JWT payload without verification (verification is the
   * server's responsibility).
   *
   * Returns `null` if the token is malformed.
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) {
        return null;
      }

      const decoded = atob(payloadSegment);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Persist the JWT to localStorage.
   */
  private storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Remove the JWT from localStorage.
   */
  private removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * If a valid token is already stored (e.g. after a page refresh), decode it
   * and push the user into the Redux store so the app starts in an
   * authenticated state.
   */
  private loadStoredUser(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    const payload = this.decodeToken(token);
    if (!payload) {
      this.removeToken();
      return;
    }

    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      this.removeToken();
      return;
    }

    const user = this.payloadToUser(payload);
    this.authRepository.loginSuccess(user, token);
  }

  /**
   * Map a decoded JWT payload to a minimal `User` object.
   *
   * The JWT only carries a subset of user fields. For a complete profile call
   * `getCurrentUser()` which hits the `/auth/profile` endpoint.
   */
  private decodeTokenToUser(token: string): User {
    const payload = this.decodeToken(token);
    if (!payload) {
      throw new Error('Invalid token: unable to decode payload');
    }
    return this.payloadToUser(payload);
  }

  /**
   * Convert a JwtPayload into a partial User object.
   */
  private payloadToUser(payload: JwtPayload): User {
    return {
      id: payload.userId,
      email: payload.email,
      firstName: '',
      lastName: '',
      roleId: payload.roleId,
      organizationId: payload.organizationId,
      createdAt: '',
      updatedAt: '',
    };
  }

  /**
   * Extract a human-readable error message from an HTTP error response.
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return Array.isArray(error.error.message)
        ? error.error.message.join(', ')
        : error.error.message;
    }
    return error.message || 'An unexpected error occurred';
  }
}
