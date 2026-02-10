#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Get all arguments passed to this script
const args = process.argv.slice(2);

// Resolve the nx binary path
const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
const nxPath = path.resolve(workspaceRoot, 'node_modules', '.bin', 'nx');

// Execute nx with all passed arguments
const nxProcess = spawn(nxPath, args, {
  stdio: 'inherit',
  cwd: workspaceRoot,
  shell: true
});

nxProcess.on('exit', (code) => {
  process.exit(code || 0);
});

nxProcess.on('error', (error) => {
  console.error('Error executing nx:', error);
  process.exit(1);
});
