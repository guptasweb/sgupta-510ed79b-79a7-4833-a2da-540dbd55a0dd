import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Shared guards. Exports no services; import this module in feature modules that need
 * PermissionsGuard or RolesGuard.
 *
 * Dependencies: PermissionsModule (PermissionsService). AuditInterceptor is registered
 * in AppModule and depends on AuditModule; see GUARDS.md.
 *
 * Guard order: 1. JWT (auth) – APP_GUARD. 2. Permissions/Roles – @UseGuards per route.
 * Do not register permission/role guards globally unless every route must require them.
 */
@Module({
  imports: [PermissionsModule],
  providers: [PermissionsGuard, RolesGuard],
  exports: [PermissionsGuard, RolesGuard],
})
export class CommonModule {}
