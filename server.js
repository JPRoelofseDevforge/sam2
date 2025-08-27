#!/usr/bin/env node

// Production server entry point
const { spawn } = require('child_process');
const path = require('path');

// Start the ultra-minimal server (plain JavaScript, no dependencies)
const serverProcess = spawn('node', ['ultra-minimal.cjs'], {
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
