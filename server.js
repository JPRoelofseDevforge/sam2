#!/usr/bin/env node

// Production server entry point
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
