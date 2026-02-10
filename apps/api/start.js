const path = require('path');

try {
  // Change to workspace root directory
  const workspaceRoot = path.resolve(__dirname, '../..');
  process.chdir(workspaceRoot);

  // Ensure ts-node uses the API tsconfig (which extends the base and has path mappings)
  process.env.TS_NODE_PROJECT =
    process.env.TS_NODE_PROJECT ||
    path.resolve(workspaceRoot, 'apps/api/tsconfig.app.json');
  // Speed up startup; type-checking is handled by Nx/tsc builds
  process.env.TS_NODE_TRANSPILE_ONLY =
    process.env.TS_NODE_TRANSPILE_ONLY || 'true';

  // Guard against unquoted Windows paths with spaces in NODE_OPTIONS
  const nodeOptions = process.env.NODE_OPTIONS || '';
  const hasUnquotedWindowsPathWithSpaces =
    /[A-Za-z]:\\[^"]* [^"]*/.test(nodeOptions);
  if (hasUnquotedWindowsPathWithSpaces) {
    delete process.env.NODE_OPTIONS;
  }

  // Load environment variables and enable TS path mapping + ts-node
  require('dotenv/config');
  require('tsconfig-paths/register');
  require('ts-node/register');

  // Bootstrap the NestJS application (TypeScript entrypoint)
  require('./src/main');
} catch (error) {
  console.error('Failed to start API:', error);
  process.exit(1);
}
