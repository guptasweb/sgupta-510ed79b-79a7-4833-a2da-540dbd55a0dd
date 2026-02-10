import type { TaskStatus, TaskCategory, TaskPriority } from '../models/task-enums';

/**
 * Task view/response shape returned by the API and consumed by the dashboard.
 */
export interface TaskView {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: TaskCategory | null;
  priority: TaskPriority;
  order: number;
  ownerId: string;
  organizationId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  ownerEmail?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
}

/**
 * Filters for listing tasks (query params or request body).
 */
export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  search?: string;
}

/**
 * User view/profile shape returned by the API and consumed by the dashboard.
 */
export interface UserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  roleName?: string;
  role?: { name?: string };
}

/**
 * Response from POST /api/auth/login.
 */
export interface LoginResponse {
  accessToken: string;
}

/**
 * Standard API error body (4xx/5xx).
 */
export interface ApiErrorBody {
  statusCode: number;
  message?: string;
  error?: string;
  code?: string;
}
