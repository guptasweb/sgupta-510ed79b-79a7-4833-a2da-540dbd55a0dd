import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthRepository } from '../../store/auth.repository';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly router: Router,
    private readonly authRepository: AuthRepository
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('token');
    const tokenValue = typeof token === 'string' ? token.trim() : '';

    const authRequest =
      tokenValue.length > 0
        ? request.clone({
            setHeaders: {
              Authorization: `Bearer ${tokenValue}`,
            },
          })
        : request;

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authRepository.logout();
          void this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}
