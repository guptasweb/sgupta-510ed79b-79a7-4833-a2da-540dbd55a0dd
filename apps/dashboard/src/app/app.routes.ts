import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { TaskListComponent } from './features/dashboard/task-list/task-list.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { AuditLogsComponent } from './features/audit/audit-logs/audit-logs.component';

export const appRoutes: Routes = [
  // -------------------------------------------------------------------------
  // Public routes -- only accessible when NOT authenticated
  // -------------------------------------------------------------------------
  {
    path: 'login',
    canActivate: [noAuthGuard],
    component: LoginComponent,
  },
  // -------------------------------------------------------------------------
  // Protected routes -- require authentication
  // -------------------------------------------------------------------------
  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: DashboardComponent,
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    component: TaskListComponent,
  },
  {
    path: 'audit',
    canActivate: [authGuard],
    component: AuditLogsComponent,
  },

  // -------------------------------------------------------------------------
  // Fallback
  // -------------------------------------------------------------------------
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
