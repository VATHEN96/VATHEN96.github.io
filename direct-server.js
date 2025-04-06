/**
 * Direct Playwright MCP Server
 * 
 * This script directly executes the Playwright MCP server command
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Playwright MCP server directly...');

// Find the executable path
const nodeModulesPath = path.join(__dirname, 'node_modules', '@executeautomation', 'playwright-mcp-server');

if (!fs.existsSync(nodeModulesPath)) {
  console.error(`Error: Package not found at expected path: ${nodeModulesPath}`);
  console.log('Checking global installation...');
  
  try {
    const npmList = execSync('npm list -g @executeautomation/playwright-mcp-server').toString();
    console.log('Global installation:', npmList);
  } catch (e) {
    console.log('Not found globally');
  }
  
  console.log('Trying to run directly with npx...');
  const serverProcess = spawn('npx', ['@executeautomation/playwright-mcp-server'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error(`Failed to start server with npx: ${error.message}`);
  });
  
  process.on('SIGINT', () => {
    console.log('Stopping server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
} else {
  console.log(`Found package at: ${nodeModulesPath}`);
  
  // Check available files
  fs.readdir(nodeModulesPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
    
    console.log('Available files:', files);
    
    // Try to find bin directory
    const binPath = path.join(nodeModulesPath, 'bin');
    if (fs.existsSync(binPath)) {
      console.log('Found bin directory, contents:');
      console.log(fs.readdirSync(binPath));
    }
    
    // Check if we can find server.js
    const serverJsPath = path.join(nodeModulesPath, 'dist', 'server.js');
    if (fs.existsSync(serverJsPath)) {
      console.log(`Found server.js at: ${serverJsPath}`);
      console.log('Trying to require it...');
      
      try {
        require(serverJsPath);
      } catch (err) {
        console.error('Error requiring server.js:', err);
      }
    } else {
      console.log('server.js not found at expected path');
    }
  });
} 