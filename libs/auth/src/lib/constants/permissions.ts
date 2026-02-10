/**
 * Single source of truth for permission names (resource:action).
 * Use these constants in decorators, guards, and seed data to avoid typos and keep names consistent.
 */
export const Permissions = {
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  AUDIT_READ: 'audit:read',
} as const;

export type PermissionString = (typeof Permissions)[keyof typeof Permissions];

/** Default permissions as { resource, action } for DB seeding. */
export const DEFAULT_PERMISSION_SPECS: ReadonlyArray<{ resource: string; action: string }> = [
  { resource: 'task', action: 'create' },
  { resource: 'task', action: 'read' },
  { resource: 'task', action: 'update' },
  { resource: 'task', action: 'delete' },
  { resource: 'audit', action: 'read' },
];
