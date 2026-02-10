# Task Management System

A secure Task Management System with role-based access control (RBAC), organization hierarchy, and audit logging in an NX monorepo.

---

## Documentation Overview

This README covers:

| Section | Contents |
|---------|----------|
| **Setup Instructions** | How to run backend and frontend; `.env` configuration (JWT secrets, database) |
| **Architecture Overview** | NX monorepo layout and rationale; shared libraries and modules |
| **Data Model Explanation** | Schema description; ERD diagram |
| **Access Control Implementation** | Roles, permissions, organization hierarchy; JWT integration with access control |
| **API Documentation** | Endpoint list; sample requests and responses |
| **Future Considerations** | Advanced role delegation; production security (refresh tokens, CSRF, RBAC caching); scaling permission checks |

---

## Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Database**: SQLite (development) or PostgreSQL (production)

### Install Dependencies

```bash
npm install
```

### .env configuration (JWT secrets, database)

Env keys and defaults are defined in **`apps/api/src/config/configuration.ts`** (typed config used by the API and seed script). Create a `.env` file at the workspace root or in `apps/api` (optional; defaults are used if omitted).

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3000` |
| `JWT_SECRET` | Secret used to sign and verify JWTs | `default-jwt-secret` |
| `JWT_EXPIRATION_SECONDS` | Access token expiry in seconds | `3600` (1 hour) |
| `CORS_ORIGIN` | Allowed origin for CORS | `http://localhost:4200` |
| `DATABASE_TYPE` | `sqlite` or `postgres` | `sqlite` |
| `DATABASE_NAME` | DB name or path (SQLite: path to `.db` file) | `task_management.db` (SQLite) / `task_management` (Postgres) |
| `DB_HOST` | PostgreSQL host (when `DATABASE_TYPE=postgres`) | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL username | (required for Postgres) |
| `DB_PASSWORD` | PostgreSQL password | (required for Postgres) |
| `NODE_ENV` | `development` or `production` | Affects DB sync and logging |

**Example `.env` (development, SQLite):**

```env
PORT=3000
JWT_SECRET=your-secure-secret-change-in-production
JWT_EXPIRATION_SECONDS=3600
DATABASE_TYPE=sqlite
DATABASE_NAME=./data/tasks.db
```

**Example `.env` (production, PostgreSQL):**

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-strong-production-secret
JWT_EXPIRATION_SECONDS=3600
DATABASE_TYPE=postgres
DATABASE_NAME=task_management
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
CORS_ORIGIN=https://your-dashboard-domain.com
```

### How to run backend and frontend

**Terminal 1 – Backend API:**

```bash
nx serve api
```

API base URL: **http://localhost:3000** (all routes under `/api`).

**Terminal 2 – Frontend Dashboard:**

```bash
nx serve dashboard
```

Dashboard URL: **http://localhost:4200**.

**Seed the database (optional):**

```bash
npm run seed
```

Seeded users and roles are described in [SEED-DATA.md](./SEED-DATA.md). Detailed run steps and troubleshooting: [RUN.md](./RUN.md).

### Testing

Tests use **Jest** for both backend and frontend.

**Run all tests:**

```bash
npm run test
```

**Run backend (API) tests only:**

```bash
npm run test:api
```

**Run frontend (dashboard) tests only:**

```bash
npm run test:dashboard
```

**Backend tests** cover:

- **Auth**: `AuthService` (login, register, getProfile), `AuthController`, JWT strategy and guard
- **RBAC**: `RolesGuard`, `PermissionsGuard`, `PermissionsService` (roles, permissions, organization access). Shared guards live in `CommonModule` (see `apps/api/src/common/GUARDS.md`).
- **API**: `TasksController`, `AuditController` (with guards mocked where needed)

**Frontend tests** cover:

- **Auth**: `AuthService` (login, logout, token, `getCurrentUser`), `authGuard`
- **State**: `authReducer`, `tasksReducer`, auth and tasks selectors
- **Components**: `LoginComponent`, `AppComponent`, `EmptyStateComponent`, `TaskListComponent`

---

## Architecture Overview

### NX Monorepo Layout and Rationale

The project is an **NX monorepo** that keeps backend, frontend, and shared code in one repo with clear boundaries and reuse.

```
apps/
  api/           NestJS backend (REST API, TypeORM, JWT, RBAC)
  dashboard/     Angular 17 frontend (TailwindCSS, NgRx-style store)
libs/
  auth/          Shared auth types, JWT payload interface, optional guards
  data/          Shared DTOs, interfaces, and models
```

**Rationale:**

- **Single repo**: One clone, one CI pipeline, shared tooling (ESLint, Jest, NX).
- **Explicit apps**: `api` and `dashboard` are deployable targets; NX handles build order and caching.
- **Shared libs**: `@task-management-system/auth` and `@task-management-system/data` are referenced via `tsconfig.base.json` paths so API and dashboard can share types and contracts without duplication.
- **Cache and affected**: NX caches builds/tests and supports affected commands so only changed projects are rebuilt or tested.

### Shared Libraries and Modules

| Library | Purpose |
|---------|---------|
| **@task-management-system/auth** | Shared auth types only (e.g. `JwtPayload`). The API implements JWT strategy and guards in `apps/api/src/auth/` (see `libs/auth/README.md`). |
| **@task-management-system/data** | Shared TypeScript interfaces, DTOs, and models used by both API and dashboard for requests/responses and domain types. |

Backend modules (inside `apps/api/src`):

- **AuthModule**: Login, register, JWT issuance, profile; uses `JwtStrategy` to attach `User` to the request.
- **PermissionsModule**: Loads role/permission and organization data; used by `PermissionsGuard` and services.
- **TasksModule**: Task CRUD and reorder; enforces permissions and organization scope.
- **AuditModule**: Audit log storage and filtering; used by an interceptor and by the audit API.

---

## Data Model Explanation

### Schema Description

- **users** – Accounts; belong to one **Organization** and one **Role** (per org). Own tasks and have audit log entries.
- **roles** – Named roles per organization (e.g. Owner, Admin, Viewer); have many-to-many **permissions**.
- **permissions** – Global `resource:action` entries (e.g. `task:create`, `task:read`, `audit:read`). Linked to roles via **role_permissions**.
- **organizations** – Tree via `parentId`; have users, roles, and tasks. Used for scoping and hierarchy checks.
- **tasks** – Title, description, status, category, priority, order; belong to an **Organization** and an **owner** (User). Unique per `(organizationId, ownerId, order)`.
- **audit_logs** – Immutable log of who did what: `userId`, `action`, `resource`, `resourceId`, `details`, `timestamp`.

Enums used in tasks:

- **TaskStatus**: `pending`, `in-progress`, `in-review`, `completed`, `on-hold`
- **TaskCategory**: `Work`, `Personal`
- **TaskPriority**: `low`, `medium`, `high`

### Entity Relationship Diagram

```
                    +------------------+
                    |  organizations   |
                    +------------------+
                    | id (PK)          |
                    | name             |
                    | parentId (FK)    |──┐
                    +------------------+  │
                          │               │
         +----------------+---------------+----------------+
         │                │               │                │
         ▼                ▼               ▼                ▼
+-------------+   +-------------+   +-------------+   +-------------+
|    users    |   |    roles    |   |   tasks     |   | audit_logs  |
+-------------+   +-------------+   +-------------+   +-------------+
| id (PK)     |   | id (PK)     |   | id (PK)     |   | id (PK)     |
| email       |   | name        |   | title       |   | userId (FK)  |
| password    |   | orgId (FK)  |   | description |   | action      |
| firstName   |   +-------------+   | status      |   | resource    |
| lastName    |         │          | category    |   | resourceId  |
| roleId (FK) |────────┤          | priority    |   | details     |
| orgId (FK)  |────────┼──────────| order       |   | timestamp   |
+-------------+        │          | ownerId(FK) |   +-------------+
         │             │          | orgId (FK)  |
         │             ▼          +-------------+
         │      +------------------+
         │      | role_permissions |
         │      +------------------+
         │      | roleId (FK)      |
         │      | permissionId(FK)|
         │      +------------------+
         │             │
         │             ▼
         │      +------------------+
         │      |  permissions     |
         │      +------------------+
         │      | id (PK)          |
         │      | resource        |
         │      | action          |
         │      +------------------+
```

Summary: **Organization** is the top-level scope. **Users** and **Roles** are scoped to an organization; **Roles** get **Permissions** via **role_permissions**. **Tasks** are scoped by organization and owner. **Audit_logs** record actions by user.

---

## Access Control Implementation

### Roles, Permissions, and Organization Hierarchy

Two-level organization hierarchy: organizations can have one level of children (e.g. TechCorp with children Engineering, Marketing).

- **Owner**: Sees all tasks in their org and child orgs. Full CRUD on all those tasks. Can view audit logs. (CEO/Founder.)
- **Admin**: Sees all tasks in their organization only. Full CRUD within their org. Can view audit logs. Cannot access parent or child orgs. (Department Manager.)
- **Viewer**: Sees only their own tasks. Read-only; no create, edit, or delete; no audit log access. (Individual contributor.)

- **Roles** are per-organization (Owner, Admin, Viewer). Each role has a set of **permissions** (e.g. `task:create`, `task:read`, `task:update`, `task:delete`, `audit:read`).
- **Role hierarchy**: Owner > Admin > Viewer. Organizations form a tree via `parentId`; only Owner uses hierarchy (parent can access child orgs); Admin is restricted to same-org only.
- (Organization tree: The API resolves “user’s org” vs “target org” by walking `parentId` upward; if the target is the user’s org or a descendant, access is allowed.

### How JWT Authentication Integrates with Access Control

1. **Login/Register** – Auth service validates credentials (or creates user), then issues a JWT signed with `JWT_SECRET`. Payload includes `userId`, `email`, `roleId`, `organizationId`.
2. **Protected routes** – Global `JwtAuthGuard` runs first. It uses **Passport JWT strategy**: extracts Bearer token, verifies signature and expiry, loads **User** (with `role` and `organization`) and attaches it to `request.user`. Routes marked `@Public()` skip this guard.
3. **Permission checks** – Controllers use `@RequirePermissions('resource:action')` and `PermissionsGuard`. The guard:
   - Reads required permissions from the decorator.
   - Ensures `request.user` is set (JWT already validated).
   - Optionally resolves a target organization from params/query/body and calls `PermissionsService.hasOrganizationAccess(user.organizationId, targetOrganizationId)`.
   - Calls `PermissionsService.userHasPermissions(user, requiredPermissions)` (role’s permissions + hierarchy).
4. **Resource-level scope** – Services (e.g. TasksService, AuditService) use the same `user` and `organizationId` to filter data (e.g. Viewer sees only own tasks; audit may be restricted to own logs depending on implementation).

So: **JWT** identifies the user and org/role; **RBAC + organization hierarchy** decide what they can do and see.

**Guard order** is fixed: JWT (auth) runs first via global `APP_GUARD`; then permission/role guards run per controller or route via `@UseGuards`. Permission and role guards are not registered globally so that public routes and per-route behavior stay explicit. See `apps/api/src/common/GUARDS.md` for details and CommonModule usage.

---

## API Documentation

Base URL: `http://localhost:3000/api` (or your deployed API URL).  
All endpoints except `POST /auth/login` and `POST /auth/register` require: `Authorization: Bearer <accessToken>`.

### Endpoint List

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/auth/login` | No | - | Login; returns `accessToken`. |
| GET | `/auth/profile` | JWT | - | Current user profile. |
| POST | `/tasks` | JWT | task:create | Create a task. |
| GET | `/tasks` | JWT | task:read | List tasks (filtered by permissions/org/owner). |
| GET | `/tasks/:id` | JWT | task:read | Get one task. |
| PUT | `/tasks/:id` | JWT | task:update | Full update of a task. |
| PATCH | `/tasks/:id/reorder` | JWT | task:update | Reorder task. |
| DELETE | `/tasks/:id` | JWT | task:delete | Delete a task. |
| GET | `/audit-log` | JWT | audit:read | List audit logs (filtered). |

### Sample Requests and Responses

**POST /auth/login**

Request:

```json
{
  "email": "owner@techcorp.com",
  "password": "password123"
}
```

Response (200):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**GET /auth/profile**

Headers: `Authorization: Bearer <accessToken>`

Response (200): User object (no password).

**POST /tasks**

Headers: `Authorization: Bearer <accessToken>`

Request:

```json
{
  "title": "Implement RBAC",
  "description": "Add role-based checks to all task endpoints",
  "status": "in-progress",
  "category": "Work",
  "priority": "high",
  "organizationId": "<uuid-of-organization>"
}
```

Response (201): Task object (e.g. `id`, `title`, `description`, `status`, `category`, `priority`, `order`, `ownerId`, `organizationId`, `createdAt`, `updatedAt`).

**GET /tasks**

Query (all optional): `status`, `category`, `priority`, `ownerId`, `organizationId`, `page`, `limit`.

Example: `GET /tasks?page=1&limit=10&status=in-progress`

Response (200):

```json
{
  "tasks": [
    {
      "id": "...",
      "title": "Implement RBAC",
      "description": "...",
      "status": "in-progress",
      "category": "Work",
      "priority": "high",
      "order": 0,
      "ownerId": "...",
      "organizationId": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "ownerEmail": "owner@techcorp.com",
      "ownerFirstName": "...",
      "ownerLastName": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**GET /audit-log**

Query (all optional): `userId`, `action`, `resource`, `resourceId`, `startDate`, `endDate`, `page`, `limit`.

Response (200):

```json
{
  "logs": [
    {
      "id": "...",
      "userId": "...",
      "action": "create",
      "resource": "task",
      "resourceId": "...",
      "details": "{\"title\":\"...\"}",
      "timestamp": "...",
      "user": {
        "id": "...",
        "email": "...",
        "firstName": "...",
        "lastName": "..."
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**Errors:** 400 (validation), 401 (missing/invalid token, user not found), 403 (forbidden by permission or org), 404 (resource not found). Delete task returns 204 with no body.

---

## Future Considerations

### Advanced role delegation

- Allow delegating a subset of permissions to another user or role for a limited time or scope (e.g. “project lead” can approve tasks in a project).
- Support temporary elevation (e.g. “act as Admin” for a session) with audit trail.
- Consider resource-level roles (e.g. “task owner” vs “task viewer”) in addition to organization-level roles.

### Production-ready security

Consider the following for production deployments:

- **JWT refresh tokens**: Short-lived access tokens (e.g. 15 min) + refresh tokens stored server-side or in a secure cookie; rotate refresh tokens on use and revoke on logout to limit impact of token theft.
- **CSRF protection**: For cookie-based or form-heavy flows, use CSRF tokens and SameSite cookies; validate origin/Referer where appropriate.
- **RBAC caching**: Cache role-permission and org-hierarchy results (e.g. in Redis) with short TTL and invalidation on role/org/permission changes to reduce DB load and latency on every request.

### Efficient scaling of permission checks

- **Batch permission checks**: For list endpoints or bulk operations, resolve required permissions once per request and cache per-role permission sets for the request lifecycle.
- **Precomputed org access**: Maintain a materialized view or table of “user can access org” (e.g. user_org_access) updated when org tree or user org changes, to avoid walking the tree on every check.
- **Indexing**: Ensure indexes on `(organizationId, ownerId, order)` for tasks, and on audit_log (e.g. userId, resource, timestamp) for fast filtering.
- **Lazy loading of user in guard**: Ensure User is loaded once (e.g. in JWT strategy) with role and organization, and reuse in PermissionsGuard to avoid extra DB hits per request.

---

## References

- [RUN.md](./RUN.md) – Run steps and troubleshooting  
- [SEED-DATA.md](./SEED-DATA.md) – Seeded users, roles, permissions, and organizations  
- [RBAC-TESTING.md](./RBAC-TESTING.md) – RBAC test scenarios  
- [AUDIT-LOGGING-STEPS.md](./AUDIT-LOGGING-STEPS.md) – Audit logging implementation notes  
