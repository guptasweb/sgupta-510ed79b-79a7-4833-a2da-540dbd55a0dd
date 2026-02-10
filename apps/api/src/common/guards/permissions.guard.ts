import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';
import { PERMISSIONS_KEY } from '@task-management-system/auth';
import { User } from '../../auth/user.entity';

const ACCESS_DENIED_MESSAGE = 'Access denied';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User | undefined;

    if (!user) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const targetOrganizationId = this.resolveOrganizationId(request);
    const hasOrgAccess = await this.permissionsService.hasOrganizationAccess(
      user.organizationId,
      targetOrganizationId
    );

    if (!hasOrgAccess) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    const hasPermissions = await this.permissionsService.userHasPermissions(
      user,
      requiredPermissions
    );
    if (!hasPermissions) {
      throw new ForbiddenException(ACCESS_DENIED_MESSAGE);
    }

    return true;
  }

  private resolveOrganizationId(request: {
    organizationId?: string;
    params?: Record<string, string | undefined>;
    query?: Record<string, string | undefined>;
    body?: Record<string, string | undefined>;
  }): string | undefined {
    return (
      request.organizationId ||
      request.params?.organizationId ||
      request.params?.orgId ||
      request.query?.organizationId ||
      request.query?.orgId ||
      request.body?.organizationId ||
      request.body?.orgId
    );
  }
}
