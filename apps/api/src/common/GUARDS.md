# Guard execution order

Guards run in this order; keep it consistent.

1. **JWT (auth)** – Global via `APP_GUARD` in `AppModule`. Ensures `request.user` is set for protected routes; public routes use `@Public()` to skip.
2. **Authorization (Permissions / Roles)** – Applied per controller or method with `@UseGuards(PermissionsGuard)` or `@UseGuards(RolesGuard)`. Run after auth so the user identity is available.

Do **not** register `PermissionsGuard` or `RolesGuard` globally unless you intend every route to require permissions/roles by default. Keeping them on specific controllers or methods keeps public and per-route behavior explicit.

## Current setup

- **AppModule**: `APP_GUARD` → `JwtAuthGuard` (global).
- **TasksController**: `@UseGuards(TaskResourceGuard, PermissionsGuard)` (controller-level).
- **AuditController**: `@UseGuards(PermissionsGuard)` (controller-level).

Resource guards (e.g. `TaskResourceGuard`) that resolve `request.organizationId` from a resource should be listed **before** `PermissionsGuard` so org-based access is checked against the actual resource.

## CommonModule

Shared guards live in `CommonModule` (no services). Feature modules that need `PermissionsGuard` or `RolesGuard` should import `CommonModule`. CommonModule depends only on `PermissionsModule`. The audit interceptor is registered in `AuditModule` (APP_INTERCEPTOR) so audit-related wiring stays in one module; it is not part of CommonModule to avoid circular imports.
