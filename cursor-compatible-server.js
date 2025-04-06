/**
 * Cursor-Compatible Playwright Server
 * 
 * Enhanced server that actually launches and controls Playwright browsers
 */

const http = require('http');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const port = 3000;
const screenshotDir = path.join(__dirname, 'screenshots');

// Make sure screenshots directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

console.log('Starting Enhanced Playwright Automation Server...');

// Track browser instances
let browser = null;
let page = null;

const server = http.createServer(async (req, res) => {
  // Always set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  console.log(`Received request: ${req.method} ${req.url}`);

  // Parse the body for POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      let data = {};
      try {
        data = JSON.parse(body);
      } catch (e) {
        console.error('Error parsing JSON:', e);
      }

      try {
        // Handle different commands
        if (req.url === '/launch') {
          // Launch browser if not already launched
          if (!browser) {
            browser = await chromium.launch({ headless: false });
            console.log('Browser launched');
          }
          if (!page) {
            page = await browser.newPage();
            console.log('New page created');
          }
          
          sendJsonResponse(res, 200, { success: true, message: 'Browser launched' });
        } else if (req.url === '/navigate') {
          if (!browser || !page) {
            await launchBrowserIfNeeded();
          }
          
          const url = data.url || 'https://accuweather.com';
          console.log(`Navigating to ${url}`);
          await page.goto(url, { waitUntil: 'domcontentloaded' });
          
          sendJsonResponse(res, 200, { success: true, message: `Navigated to ${url}` });
        } else if (req.url === '/screenshot') {
          if (!browser || !page) {
            await launchBrowserIfNeeded();
          }
          
          const screenshotPath = path.join(screenshotDir, `screenshot-${Date.now()}.png`);
          console.log(`Taking screenshot to ${screenshotPath}`);
          await page.screenshot({ path: screenshotPath, fullPage: data.fullPage });
          
          sendJsonResponse(res, 200, { 
            success: true, 
            screenshotPath,
            message: 'Screenshot taken'
          });
        } else if (req.url === '/query') {
          if (!browser || !page) {
            await launchBrowserIfNeeded();
          }
          
          const selector = data.selector;
          console.log(`Querying selector: ${selector}`);
          
          const result = await page.$(selector);
          const text = result ? await result.textContent() : 'Element not found';
          
          sendJsonResponse(res, 200, { 
            success: !!result, 
            text, 
            message: result ? 'Element found' : 'Element not found' 
          });
        } else if (req.url === '/execute') {
          if (!browser || !page) {
            await launchBrowserIfNeeded();
          }
          
          const command = data.command;
          if (!command) {
            return sendJsonResponse(res, 400, { success: false, message: 'No command provided' });
          }
          
          console.log(`Executing command: ${command}`);
          const result = await eval(`(async () => { ${command} })()`);
          
          sendJsonResponse(res, 200, { 
            success: true, 
            result, 
            message: 'Command executed' 
          });
        } else if (req.url === '/close') {
          if (page) {
            await page.close();
            page = null;
            console.log('Page closed');
          }
          if (browser) {
            await browser.close();
            browser = null;
            console.log('Browser closed');
          }
          
          sendJsonResponse(res, 200, { success: true, message: 'Browser closed' });
        } else {
          sendJsonResponse(res, 404, { success: false, message: 'Unknown endpoint' });
        }
      } catch (error) {
        console.error('Error:', error);
        sendJsonResponse(res, 500, { success: false, error: error.message });
      }
    });
  } else if (req.method === 'GET') {
    if (req.url === '/status') {
      sendJsonResponse(res, 200, { 
        status: 'running',
        browserActive: browser !== null,
        pageActive: page !== null
      });
    } else {
      sendJsonResponse(res, 404, { success: false, message: 'Unknown endpoint' });
    }
  } else {
    sendJsonResponse(res, 405, { success: false, message: 'Method not allowed' });
  }
});

// Helper functions
function sendJsonResponse(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function launchBrowserIfNeeded() {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    console.log('Browser launched');
  }
  if (!page) {
    page = await browser.newPage();
    console.log('New page created');
  }
}

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log('Ready to receive automation commands');
}); 