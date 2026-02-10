import { SetMetadata } from '@nestjs/common';
import type { PermissionString } from '../constants/permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restricts route access to users that have all of the given permissions
 * (e.g. Permissions.TASK_CREATE, Permissions.AUDIT_READ) within the resolved organization context.
 */
export const RequirePermissions = (...permissions: PermissionString[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
