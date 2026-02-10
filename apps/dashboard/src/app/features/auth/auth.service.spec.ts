import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthRepository } from '../../store/auth.repository';
import { StoreModule } from '@ngrx/store';
import { authReducer } from '../../store/auth.reducer';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  let authRepository: AuthRepository;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        StoreModule.forRoot({ auth: authReducer }),
      ],
      providers: [AuthService, AuthRepository],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    authRepository = TestBed.inject(AuthRepository);
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST to login and return user', (done) => {
      const email = 'test@example.com';
      const password = 'password123';
      const token = createJwt({ userId: 'user-1', email, roleId: 'r1', organizationId: 'o1' });

      service.login(email, password).subscribe((user) => {
        expect(user.id).toBe('user-1');
        expect(user.email).toBe(email);
        expect(service.getToken()).toBe(token);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush({ accessToken: token });
    });

    it('should dispatch loginFailure and throw on error', (done) => {
      service.login('test@example.com', 'wrong').subscribe({
        error: (err) => {
          expect(err.message).toContain('Invalid');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear token and navigate to login', () => {
      localStorage.setItem('token', 'some-token');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getToken', () => {
    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
    });
    it('should return stored token', () => {
      localStorage.setItem('token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
    it('should return false when token is malformed', () => {
      localStorage.setItem('token', 'not-a-jwt');
      expect(service.isAuthenticated()).toBe(false);
    });
    it('should return true when token is valid and not expired', () => {
      const token = createJwt(
        { userId: 'u1', email: 'a@b.com', roleId: 'r1', organizationId: 'o1' },
        { exp: Math.floor(Date.now() / 1000) + 3600 }
      );
      localStorage.setItem('token', token);
      expect(service.isAuthenticated()).toBe(true);
    });
    it('should return false and remove token when expired', () => {
      const token = createJwt(
        { userId: 'u1', email: 'a@b.com', roleId: 'r1', organizationId: 'o1' },
        { exp: Math.floor(Date.now() / 1000) - 60 }
      );
      localStorage.setItem('token', token);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getToken()).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should return null for invalid token', () => {
      expect(service.decodeToken('invalid')).toBeNull();
    });
    it('should return payload for valid JWT', () => {
      const payload = { userId: 'u1', email: 'a@b.com', roleId: 'r1', organizationId: 'o1' };
      const token = createJwt(payload);
      const decoded = service.decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('u1');
      expect(decoded?.email).toBe('a@b.com');
    });
  });

  describe('getCurrentUser', () => {
    it('should GET profile and return user', (done) => {
      const user = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B' } as any;
      service.getCurrentUser().subscribe((res) => {
        expect(res).toEqual(user);
        done();
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(user);
    });
  });
});

function createJwt(
  payload: Record<string, unknown>,
  extra?: { exp?: number; iat?: number }
): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(
    JSON.stringify({
      ...payload,
      iat: extra?.iat ?? Math.floor(Date.now() / 1000),
      exp: extra?.exp ?? Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = btoa('signature');
  return `${header}.${body}.${signature}`;
}
