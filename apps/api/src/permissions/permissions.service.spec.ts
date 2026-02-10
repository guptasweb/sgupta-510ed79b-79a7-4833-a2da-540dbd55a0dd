import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from './permissions.service';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { Organization } from './entities/organization.entity';
import { User } from '../auth/user.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: jest.Mocked<Partial<Repository<Permission>>>;
  let roleRepository: jest.Mocked<Partial<Repository<Role>>>;
  let organizationRepository: jest.Mocked<Partial<Repository<Organization>>>;

  const mockRole = {
    id: 'role-uuid',
    name: 'admin',
    organizationId: 'org-uuid',
    permissions: [
      { resource: 'task', action: 'create' },
      { resource: 'task', action: 'read' },
      { resource: 'task', action: 'update' },
      { resource: 'task', action: 'delete' },
      { resource: 'audit', action: 'read' },
    ],
  } as Role;

  const mockUser = {
    id: 'user-uuid',
    roleId: 'role-uuid',
    role: mockRole,
  } as User;

  beforeEach(async () => {
    permissionRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };
    roleRepository = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockRole]),
    };
    organizationRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getRepositoryToken(Permission), useValue: permissionRepository },
        { provide: getRepositoryToken(Role), useValue: roleRepository },
        { provide: getRepositoryToken(Organization), useValue: organizationRepository },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should not throw when seeding default permissions', async () => {
      (permissionRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('userHasPermissions', () => {
    it('should return true when no permissions required', async () => {
      const result = await service.userHasPermissions(mockUser, []);
      expect(result).toBe(true);
    });

    it('should return true when user role has required permissions', async () => {
      (roleRepository.findOne as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.userHasPermissions(mockUser, ['task:read', 'task:create']);

      expect(result).toBe(true);
    });

    it('should return false when user role lacks a required permission', async () => {
      (roleRepository.findOne as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.userHasPermissions(mockUser, ['task:read', 'unknown:action']);

      expect(result).toBe(false);
    });

    it('should return true when requiredPermissions is undefined', async () => {
      const result = await service.userHasPermissions(mockUser, undefined as any);
      expect(result).toBe(true);
    });
  });

  describe('userHasRole', () => {
    it('should return true when no roles required', async () => {
      const result = await service.userHasRole(mockUser, []);
      expect(result).toBe(true);
    });

    it('should return true when user has required role (from relation)', async () => {
      const result = await service.userHasRole(mockUser, ['admin']);

      expect(result).toBe(true);
    });

    it('should return true when user has higher role in hierarchy (owner > admin)', async () => {
      const ownerUser = { ...mockUser, role: { ...mockRole, name: 'owner' } } as User;
      const result = await service.userHasRole(ownerUser, ['admin', 'viewer']);

      expect(result).toBe(true);
    });

    it('should return false when user role does not match', async () => {
      const viewerUser = { ...mockUser, role: { ...mockRole, name: 'viewer' } } as User;
      const result = await service.userHasRole(viewerUser, ['owner']);

      expect(result).toBe(false);
    });

    it('should fetch role from repo when user.role is missing', async () => {
      const userWithoutRole = { ...mockUser, role: undefined } as User;
      (roleRepository.findOne as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.userHasRole(userWithoutRole, ['admin']);

      expect(result).toBe(true);
      expect(roleRepository.findOne).toHaveBeenCalledWith({ where: { id: userWithoutRole.roleId } });
    });
  });

  describe('hasOrganizationAccess', () => {
    it('should return true when target is undefined', async () => {
      const result = await service.hasOrganizationAccess('org-uuid', undefined);
      expect(result).toBe(true);
    });

    it('should return true when target is same as user org', async () => {
      const result = await service.hasOrganizationAccess('org-uuid', 'org-uuid');
      expect(result).toBe(true);
    });

    it('should return false when target org is not same and not a child', async () => {
      (organizationRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'other-org', parentId: null });

      const result = await service.hasOrganizationAccess('org-uuid', 'other-org');

      expect(result).toBe(false);
    });

    it('should return true when target is child of user org', async () => {
      (organizationRepository.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 'child-org', parentId: 'org-uuid' });

      const result = await service.hasOrganizationAccess('org-uuid', 'child-org');

      expect(result).toBe(true);
    });
  });
});
