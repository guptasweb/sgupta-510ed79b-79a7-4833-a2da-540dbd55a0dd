/**
 * Request/contract shapes for auth and tasks.
 * API apps can implement class-validator DTOs that satisfy these interfaces.
 */

/** Payload for login (email + password). */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Payload for registration. */
export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  organizationId: string;
}

/** Shape for creating a task. */
export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  status?: string;
  category?: string | null;
  priority?: string;
  order?: number;
}

/** Shape for updating a task (partial). */
export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: string;
  category?: string | null;
  priority?: string;
  order?: number;
}
