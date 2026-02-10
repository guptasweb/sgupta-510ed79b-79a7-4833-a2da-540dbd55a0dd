# Seed Data Summary: Entities and Access

This document describes the data seeded by the Nest-based seed command (`npm run seed`, which runs `SeedService` via `apps/api/src/database/seeds/run-seed.ts`) and how it maps to entities, roles, permissions, and access levels.

---

## 1. Permissions (global)

| Resource | Action |
|----------|--------|
| task | create |
| task | read |
| task | update |
| task | delete |
| audit | read |

---

## 2. Organizations

| Name | Type |
|------|------|
| TechCorp | Parent (no parent) |
| Engineering | Child of TechCorp |
| Marketing | Child of TechCorp (sibling of Engineering) |

---

## 3. Roles and permissions (per organization)

Two-level organization hierarchy: organizations can have one level of children (e.g. TechCorp > Engineering, Marketing). The same three roles are created per organization:

| Role | Permissions | Scope and access |
|------|-------------|------------------|
| Owner | task:create, task:read, task:update, task:delete, audit:read | Sees all tasks in **their org and child orgs**. Full CRUD, audit logs. (CEO/Founder.) |
| Admin | task:create, task:read, task:update, task:delete, audit:read | Sees all tasks in **their organization only**. Full CRUD within org, audit logs. No parent/child org access. (Department Manager.) |
| Viewer | task:read | **Own tasks only.** Read-only; no create/edit/delete; no audit log access. (Individual contributor.) |

---

## 4. Users (RBAC test accounts)

All seeded users use password: **password123**

| Email | Role | Organization | Intended access |
|-------|------|---------------|-----------------|
| owner@techcorp.com | Owner | TechCorp | All rights; parent + child orgs; full CRUD; audit logs |
| viewer@techcorp.com | Viewer | TechCorp | Own tasks only; read-only; no audit |
| admin-child@techcorp.com | Admin | Engineering | Org-level rights; Engineering only; full CRUD; audit logs |
| admin-marketing@techcorp.com | Admin | Marketing | Org-level rights; Marketing only; full CRUD; audit logs |

---

## 5. Tasks (by user/organization)

- **Owner (TechCorp)**: 7 tasks (5 in TechCorp, 2 in Engineering).
- **Viewer (TechCorp)**: 3 tasks in TechCorp.
- **Admin (Engineering)**: 4 tasks in Engineering.
- **Admin (Marketing)**: 3 tasks in Marketing.

---

## 6. Access level summary

| User | Org scope | Task create | Task read | Task update | Task delete | Audit read |
|------|------------|-------------|-----------|-------------|-------------|------------|
| owner@techcorp.com | Parent + child | Yes | Yes | Yes | Yes | Yes |
| viewer@techcorp.com | Own tasks only | No | Yes (own) | No | No | No |
| admin-child@techcorp.com | Own org only | Yes | Yes | Yes | Yes | Yes |
| admin-marketing@techcorp.com | Own org only | Yes | Yes | Yes | Yes | Yes |

---

## Running the seed

From the project root, run `npm run seed`. The seed runs inside a Nest application context using the same TypeORM config and entities as the API (`SeedRunnerModule` -> `DatabaseModule` + `SeedsModule`), so there is no duplicate DB configuration. See `RUN.md` or the backend app docs for environment (e.g. SQLite vs PostgreSQL).
