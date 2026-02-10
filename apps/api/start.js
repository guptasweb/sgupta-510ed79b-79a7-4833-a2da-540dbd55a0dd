// Wrapper script to handle paths with spaces on Windows
// This script changes to the workspace root and runs ts-node via npx
const { execFileSync } = require('child_process');
const path = require('path');

try {
  // Change to workspace root directory
  const workspaceRoot = path.resolve(__dirname, '../..');
  process.chdir(workspaceRoot);
  
  // Use relative paths - these will be resolved from workspace root
  const mainFile = 'apps/api/src/main.ts';
  const tsConfig = 'apps/api/tsconfig.app.json';
  
  // Resolve ts-node from workspace root to avoid PATH issues
  const tsNodeBin = require.resolve('ts-node/dist/bin.js', {
    paths: [workspaceRoot]
  });

  // Execute synchronously to keep process alive
  const env = { ...process.env };
  const nodeOptions = env.NODE_OPTIONS || '';
  const hasUnquotedWindowsPathWithSpaces =
    /[A-Za-z]:\\[^"]* [^"]*/.test(nodeOptions);
  if (hasUnquotedWindowsPathWithSpaces) {
    // Guard against unquoted Windows paths with spaces in NODE_OPTIONS.
    delete env.NODE_OPTIONS;
  }

  execFileSync(
    process.execPath,
    [tsNodeBin, '--project', tsConfig, mainFile],
    {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env
    }
  );
} catch (error) {
  console.error('Failed to start API:', error.message);
  process.exit(1);
}
