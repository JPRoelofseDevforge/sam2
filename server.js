#!/usr/bin/env node

// Production server entry point
const { spawn } = require('child_process');
const path = require('path');

// Start the minimal server using tsx (no database dependencies)
const serverProcess = spawn('npx', ['tsx', 'src/minimal-server.ts'], {
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
