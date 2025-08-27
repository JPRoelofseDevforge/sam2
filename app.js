#!/usr/bin/env node

// Production server entry point for IIS
const { spawn } = require('child_process');
const path = require('path');

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Start the server using tsx
const serverProcess = spawn('npx', ['tsx', 'src/api/server.ts'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd(),
  env: process.env
});

// Pipe output to IIS
serverProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

serverProcess.stderr.on('data', (data) => {
  console.error(data.toString());
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