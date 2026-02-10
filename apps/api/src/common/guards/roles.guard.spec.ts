import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import { User } from '../../auth/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let permissionsService: jest.Mocked<PermissionsService>;

  const mockUser: Partial<User> = {
    id: 'user-uuid',
    organizationId: 'org-uuid',
    roleId: 'role-uuid',
    role: { id: 'role-uuid', name: 'admin' } as any,
  };

  const createContext = (request: Record<string, unknown> = {}): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ ...request }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    permissionsService = {
      hasOrganizationAccess: jest.fn(),
      userHasRole: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector, permissionsService);
    jest.clearAllMocks();
  });

  it('should allow access when no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createContext({ user: mockUser });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(permissionsService.hasOrganizationAccess).not.toHaveBeenCalled();
    expect(permissionsService.userHasRole).not.toHaveBeenCalled();
  });

  it('should allow access when required roles is empty array', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const context = createContext({ user: mockUser });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Access denied');
    expect(permissionsService.userHasRole).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user has no org access', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (permissionsService.hasOrganizationAccess as jest.Mock).mockResolvedValue(false);
    const context = createContext({
      user: mockUser,
      params: { organizationId: 'other-org' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Access denied');
    expect(permissionsService.hasOrganizationAccess).toHaveBeenCalledWith(
      mockUser.organizationId,
      'other-org'
    );
    expect(permissionsService.userHasRole).not.toHaveBeenCalled();
  });

  it('should allow access when user has org access and required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (permissionsService.hasOrganizationAccess as jest.Mock).mockResolvedValue(true);
    (permissionsService.userHasRole as jest.Mock).mockResolvedValue(true);
    const context = createContext({ user: mockUser });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(permissionsService.userHasRole).toHaveBeenCalledWith(mockUser, ['admin']);
  });

  it('should throw ForbiddenException when user does not have required role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner']);
    (permissionsService.hasOrganizationAccess as jest.Mock).mockResolvedValue(true);
    (permissionsService.userHasRole as jest.Mock).mockResolvedValue(false);
    const context = createContext({ user: mockUser });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Access denied');
  });

  it('should resolve organizationId from query when not in params', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    (permissionsService.hasOrganizationAccess as jest.Mock).mockResolvedValue(true);
    (permissionsService.userHasRole as jest.Mock).mockResolvedValue(true);
    const context = createContext({
      user: mockUser,
      query: { organizationId: 'query-org' },
    });

    await guard.canActivate(context);

    expect(permissionsService.hasOrganizationAccess).toHaveBeenCalledWith(
      mockUser.organizationId,
      'query-org'
    );
  });
});
