# @task-management-system/auth

Reusable RBAC logic and decorators plus shared auth types. **Library role:** this lib holds reusable RBAC logic and decorators; shared TypeScript interfaces and DTOs live in `@task-management-system/data`.

The API imports decorators and metadata keys from here; strategy and guards stay in the app.

## What lives here

- **Interfaces**: `JwtPayload` (with optional `iat`/`exp`) for token payloads.
- **Decorators**: `Public()`, `Roles(...)`, `RequirePermissions(...)`, `CurrentUser` and their metadata keys (`IS_PUBLIC_KEY`, `ROLES_KEY`, `PERMISSIONS_KEY`). All NestJS-based so the API uses them on controllers; guards in the API read these keys via Reflector.
- **Constants**: `Permissions`, `PermissionString`, `DEFAULT_PERMISSION_SPECS` (single source of truth for permission names and default specs; used by decorators, guards, and seed data).

## What lives in the API

- **Guards**: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard` in `apps/api` (they use PermissionsService and app entities).
- **Strategy**: `JwtStrategy`, auth service, controller, and user entity in `apps/api/src/auth/`.

Import from `@task-management-system/auth` for decorators and `JwtPayload`; implement strategy and guards in the app.
