import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restricts route access to users that have one of the given roles
 * (within the resolved organization context).
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
