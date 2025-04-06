/**
 * Simple MCP Server for Playwright
 * 
 * This script creates a basic server that implements the MCP protocol
 * for Cursor to communicate with Playwright.
 */

const http = require('http');
const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Configuration
const PORT = 3300;
const debug = true;

// Create server
const server = http.createServer(async (req, res) => {
  log(`Received request: ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Parse the request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      // Parse the body if present
      let requestData = {};
      if (body) {
        try {
          requestData = JSON.parse(body);
          log('Request data:', requestData);
        } catch (e) {
          log('Error parsing request body:', e);
        }
      }

      // Handle different endpoints
      if (req.url === '/status') {
        // Status endpoint
        sendJsonResponse(res, 200, { status: 'running' });
      } else if (req.url === '/launch' && req.method === 'POST') {
        // Launch browser endpoint
        try {
          log('Launching browser...');
          const browser = await chromium.launch();
          const context = await browser.newContext();
          const page = await context.newPage();
          
          // You would normally store these in a session store
          sendJsonResponse(res, 200, { success: true, message: 'Browser launched' });
        } catch (error) {
          log('Error launching browser:', error);
          sendJsonResponse(res, 500, { success: false, error: error.message });
        }
      } else if (req.url === '/execute' && req.method === 'POST') {
        // Execute test endpoint
        const testPath = requestData.testPath || './tests/example.spec.ts';
        
        log(`Executing test at ${testPath}...`);
        
        // Execute the test using Playwright CLI
        const testProcess = spawn('npx', ['playwright', 'test', testPath], {
          stdio: 'pipe',
          shell: true
        });
        
        let output = '';
        testProcess.stdout.on('data', (data) => {
          const chunk = data.toString();
          output += chunk;
          log(`Test output: ${chunk}`);
        });
        
        testProcess.stderr.on('data', (data) => {
          const chunk = data.toString();
          output += chunk;
          log(`Test error: ${chunk}`);
        });
        
        testProcess.on('close', (code) => {
          log(`Test process exited with code ${code}`);
          sendJsonResponse(res, 200, { 
            success: code === 0, 
            exitCode: code,
            output: output
          });
        });
        
        // Don't end the response here - it will be ended when the process completes
        return;
      } else {
        // Unknown endpoint
        sendJsonResponse(res, 404, { error: 'Not found' });
      }
    } catch (error) {
      log('Error processing request:', error);
      sendJsonResponse(res, 500, { error: error.message });
    }
  });
});

// Start the server
server.listen(PORT, () => {
  log(`Server running at http://localhost:${PORT}/`);
  log(`Use this address in your Cursor Playwright configuration.`);
});

// Helper functions
function sendJsonResponse(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function log(...args) {
  if (debug) {
    console.log(`[MCP Server]`, ...args);
  }
} 