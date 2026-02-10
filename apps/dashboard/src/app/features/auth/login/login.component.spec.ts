import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: { login: jest.Mock };
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    const authServiceSpy = { login: jest.fn() };
    const routerSpy = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as any;
    router = TestBed.inject(Router) as any;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with email and password fields', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')).toBeDefined();
    expect(component.loginForm.get('password')).toBeDefined();
  });

  it('should validate required fields', () => {
    component.loginForm.patchValue({ email: '', password: '' });
    component.onSubmit();
    expect(component.loginForm.invalid).toBeTruthy();
  });

  it('should call authService.login on signin submit', () => {
    authService.login.mockReturnValue(of({} as any));
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });
    component.onSubmit();
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should navigate to dashboard on successful login', () => {
    authService.login.mockReturnValue(of({} as any));
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should display error message on login failure', () => {
    authService.login.mockReturnValue(throwError(() => ({ message: 'Invalid credentials' })));
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword',
    });
    component.onSubmit();
    expect(component.errorMessage).toBe('Invalid credentials');
  });
});
