# API E2E tests

End-to-end tests for the API using a **dedicated in-memory SQLite database** so RBAC and app behavior can be tested in isolation.

- **Layout**: `*.e2e-spec.ts` files live in this `e2e/` folder (not next to source files).
- **Setup**: `setup-env.js` sets `NODE_ENV=test` and `DATABASE_NAME=:memory:` so the app uses an in-memory DB.
- **Boot**: Tests create a full Nest app (`AppModule` + `SeedsModule`), run the seed, then call endpoints via `supertest`.
- **RBAC**: `rbac.e2e-spec.ts` covers login, task create/read permissions (viewer vs owner), and audit read permission.

Run unit tests (specs next to source): `nx test api`  
Run e2e tests: `nx e2e api`
