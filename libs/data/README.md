# @task-management-system/data

Shared TypeScript interfaces, DTOs, and domain models used by the API and dashboard so both apps use the same types for API contracts. **Library role:** this lib contains shared TypeScript interfaces and DTOs; reusable RBAC logic and decorators live in `@task-management-system/auth`.

## What lives here

- **Enums**: `TaskStatus`, `TaskCategory`, `TaskPriority` (single source of truth for task domain values).
- **Interfaces**: `TaskView`, `TaskFilters`, `UserView`, `LoginResponse`, `ApiErrorBody` (API response/request shapes).
- **DTOs** (plain interfaces): `LoginCredentials`, `RegisterPayload`, `CreateTaskPayload`, `UpdateTaskPayload` for request bodies. The API implements class-validator DTOs that satisfy these.

## Usage

- **API**: Import enums from here for the task entity and DTOs; use interfaces for response typing where useful.
- **Dashboard**: Import `Task`, `TaskFilters`, `UserView`, `LoginResponse`, and enums via this lib (dashboard re-exports them from `shared/models` and `features/auth/auth.interfaces` for convenience).
