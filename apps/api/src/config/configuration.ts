/**
 * Typed application configuration.
 * All env usage is centralized here. Used by ConfigModule.load and by the seed script.
 *
 * Environment variables (with defaults):
 * - NODE_ENV: development | production (default: development)
 * - PORT: server port (default: 3000)
 * - CORS_ORIGIN: allowed origin for CORS (default: http://localhost:4200)
 * - DATABASE_TYPE: sqlite | postgres (default: sqlite)
 * - DATABASE_NAME: DB name or SQLite file path (default: task_management.db or task_management for postgres)
 * - DB_HOST: Postgres host (default: localhost)
 * - DB_PORT: Postgres port (default: 5432)
 * - DB_USERNAME: Postgres username (required for postgres)
 * - DB_PASSWORD: Postgres password (required for postgres)
 * - JWT_SECRET: secret for signing JWTs (default: default-jwt-secret; set in production)
 * - JWT_EXPIRATION_SECONDS: token TTL in seconds (default: 3600)
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres';
  /** SQLite: file path. Postgres: database name. */
  database: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

export interface JwtConfig {
  secret: string;
  expiresInSeconds: number;
}

export function configuration(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseType = (process.env.DATABASE_TYPE || 'sqlite') as 'sqlite' | 'postgres';

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3000', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    database: {
      type: databaseType,
      database: process.env.DATABASE_NAME || (databaseType === 'postgres' ? 'task_management' : 'task_management.db'),
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'default-jwt-secret',
      expiresInSeconds: parseInt(process.env.JWT_EXPIRATION_SECONDS || '3600', 10),
    },
  };
}

/** Build TypeORM DataSource options from DatabaseConfig. Used by AppModule and seed script. */
export function getTypeOrmOptions(
  dbConfig: DatabaseConfig,
  entities: string[] | Function[],
  options: { synchronize: boolean; logging: boolean }
): Record<string, unknown> {
  const { synchronize, logging } = options;
  if (dbConfig.type === 'postgres') {
    return {
      type: 'postgres',
      host: dbConfig.host ?? 'localhost',
      port: dbConfig.port ?? 5432,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities,
      synchronize,
      logging,
    };
  }
  return {
    type: 'sqlite',
    database: dbConfig.database,
    entities,
    synchronize,
    logging,
  };
}
