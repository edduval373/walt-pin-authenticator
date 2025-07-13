// Simple server that runs the TypeScript development server
import { spawn } from 'child_process';

// Set environment variables
process.env.PIM_API_URL = "https://master.pinauth.com";
process.env.HEALTH_CHECK_URL = "https://master.pinauth.com/health";
process.env.NODE_ENV = "development";

console.log('Starting Disney Pin Authenticator development server...');

// Start the TypeScript server
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});