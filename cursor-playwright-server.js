/**
 * Cursor Playwright MCP Server
 * 
 * This script initializes a Playwright MCP server configured specifically for Cursor.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Define the port
const PORT = 4000;

// Create a configuration file for the MCP server to use
const configPath = path.join(os.tmpdir(), 'playwright-mcp-config.json');
const config = {
  port: PORT,
  browsers: ['chromium'],
  headless: true,
  timeout: 30000,
  retries: 1,
  testDir: './tests',
  reporter: 'list'
};

// Write the configuration
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`Created configuration at: ${configPath}`);

// Get path to the node_modules executable
const serverPath = path.join(
  __dirname,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright-mcp-server.cmd' : 'playwright-mcp-server'
);

console.log(`Starting Playwright MCP Server on port ${PORT}...`);
console.log(`Server path: ${serverPath}`);

// Spawn the process with the configuration
const serverProcess = spawn(serverPath, ['--port', PORT.toString(), '--config', configPath], {
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