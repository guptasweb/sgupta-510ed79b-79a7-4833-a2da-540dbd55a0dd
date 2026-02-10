import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '@task-management-system/auth';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const createMockContext = (overrides?: Partial<ExecutionContext>): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
      ...overrides,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should allow access when route is marked as public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });


  describe('handleRequest', () => {
    it('should throw when err is present', () => {
      const context = createMockContext();
      const err = new Error('Token expired');

      expect(() =>
        guard.handleRequest(err, null, null, context)
      ).toThrow(UnauthorizedException);
      expect(() =>
        guard.handleRequest(err, null, null, context)
      ).toThrow(/Token invalid or expired|Token expired/);
    });

    it('should throw when user is missing', () => {
      const context = createMockContext();

      expect(() =>
        guard.handleRequest(null, null, null, context)
      ).toThrow(UnauthorizedException);
      expect(() =>
        guard.handleRequest(null, null, null, context)
      ).toThrow(/Authentication required/);
    });

    it('should return user when no error and user present', () => {
      const context = createMockContext();
      const user = { id: 'user-uuid', email: 'test@example.com' };

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toBe(user);
    });
  });
});
