import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { Organization } from './entities/organization.entity';
import { User } from '../auth/user.entity';
import { DEFAULT_PERMISSION_SPECS } from '@task-management-system/auth';

const DEFAULT_PERMISSIONS = DEFAULT_PERMISSION_SPECS;

const ROLE_HIERARCHY = ['owner', 'admin', 'viewer'];

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultPermissions();
  }

  async userHasPermissions(user: User, requiredPermissions: string[]): Promise<boolean> {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const permissions = await this.getPermissionsForRole(user.roleId);
    const permissionSet = new Set(permissions.map((permission) => permission.toLowerCase()));

    return requiredPermissions.every((permission) =>
      permissionSet.has(permission.toLowerCase())
    );
  }

  async userHasRole(user: User, requiredRoles: string[]): Promise<boolean> {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    let roleName = user.role?.name;
    if (!roleName) {
      const role = await this.roleRepository.findOne({ where: { id: user.roleId } });
      roleName = role?.name;
    }

    if (!roleName) {
      return false;
    }

    const allowedRoles = new Set(this.getRoleHierarchy(roleName));
    return requiredRoles.some((role) => allowedRoles.has(this.normalizeRoleName(role)));
  }

  async getPermissionsForRole(roleId: string): Promise<string[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      return [];
    }

    const roles = await this.getInheritedRoles(role);
    const permissionSet = new Set<string>();

    roles.forEach((roleItem) => {
      roleItem.permissions?.forEach((permission) => {
        permissionSet.add(`${permission.resource}:${permission.action}`);
      });
    });

    return Array.from(permissionSet);
  }

  async hasOrganizationAccess(userOrganizationId: string, targetOrganizationId?: string | null): Promise<boolean> {
    if (!targetOrganizationId || userOrganizationId === targetOrganizationId) {
      return true;
    }

    let currentId: string | null = targetOrganizationId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === userOrganizationId) {
        return true;
      }

      if (visited.has(currentId)) {
        break;
      }

      visited.add(currentId);

      const organization = await this.organizationRepository.findOne({
        where: { id: currentId },
        select: ['id', 'parentId'],
      });

      if (!organization) {
        return false;
      }

      currentId = organization.parentId;
    }

    return false;
  }

  private async seedDefaultPermissions(): Promise<void> {
    for (const permission of DEFAULT_PERMISSIONS) {
      const existing = await this.permissionRepository.findOne({
        where: { resource: permission.resource, action: permission.action },
      });

      if (!existing) {
        const created = this.permissionRepository.create(permission);
        await this.permissionRepository.save(created);
      }
    }
  }

  private async getInheritedRoles(role: Role): Promise<Role[]> {
    const allowedRoleNames = new Set(this.getRoleHierarchy(role.name));
    const rolesInOrganization = await this.roleRepository.find({
      where: { organizationId: role.organizationId },
      relations: ['permissions'],
    });

    return rolesInOrganization.filter((roleItem) =>
      allowedRoleNames.has(this.normalizeRoleName(roleItem.name))
    );
  }

  private getRoleHierarchy(roleName: string): string[] {
    const normalized = this.normalizeRoleName(roleName);
    const index = ROLE_HIERARCHY.indexOf(normalized);

    if (index === -1) {
      return [normalized];
    }

    return ROLE_HIERARCHY.slice(index);
  }

  private normalizeRoleName(roleName: string): string {
    return roleName.trim().toLowerCase();
  }
}
