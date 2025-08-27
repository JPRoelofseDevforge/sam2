#!/usr/bin/env node

// Production server entry point
const { spawn } = require('child_process');
const path = require('path');

// Start the server using tsx
const serverProcess = spawn('npx', ['tsx', 'src/api/server.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

// Handle process termination
process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
});

serverProcess.on('exit', (code) => {
  process.exit(code);
});
