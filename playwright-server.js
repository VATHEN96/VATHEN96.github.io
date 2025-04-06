const { spawn } = require('child_process');
const path = require('path');

// Define the port
const PORT = 4000;

// Get path to the node_modules executable
const serverPath = path.join(
  __dirname,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright-mcp-server.cmd' : 'playwright-mcp-server'
);

console.log(`Starting Playwright MCP Server on port ${PORT}...`);
console.log(`Server path: ${serverPath}`);

// Spawn the process
const serverProcess = spawn(serverPath, ['--port', PORT.toString()], {
  stdio: 'inherit',
  shell: true
});

// Handle server events
serverProcess.on('error', (error) => {
  console.error(`Failed to start server: ${error.message}`);
});

// Clean up the process when this script exits
process.on('SIGINT', () => {
  console.log('Stopping server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('exit', () => {
  serverProcess.kill();
}); 