// Run before e2e tests so the app uses an in-memory SQLite DB.
process.env.NODE_ENV = 'test';
process.env.DATABASE_NAME = ':memory:';
