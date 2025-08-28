// Test script to verify server can start correctly
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing server startup...');

const serverProcess = spawn('npx', ['tsx', 'src/api/server.ts'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'pipe',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '3001'
  }
});

let output = '';
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Server output:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.error('Server error:', data.toString().trim());
});

serverProcess.on('close', (code) => {
  console.log(`\nServer process exited with code ${code}`);
  if (code === 0) {
    console.log('✅ Server started successfully');
  } else {
    console.log('❌ Server failed to start');
    console.log('Error output:', errorOutput);
  }
  process.exit(code);
});

// Wait a bit then kill the process
setTimeout(() => {
  console.log('\nStopping test server...');
  serverProcess.kill();
}, 5000);