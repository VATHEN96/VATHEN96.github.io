#!/usr/bin/env node

// Script to trigger a manual Cloudflare Pages deployment
const { execSync } = require('child_process');
const fs = require('fs');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.blue}Force-triggering Cloudflare Pages Deployment...${colors.reset}`);

try {
  // Step 1: Get current time and git commit for versioning
  const timestamp = new Date().toISOString();
  let gitCommit = 'unknown';
  try {
    gitCommit = execSync('git rev-parse HEAD').toString().trim();
  } catch (err) {
    console.log(`${colors.yellow}Unable to get git commit, using timestamp only${colors.reset}`);
  }
  
  const buildId = `${timestamp}_${gitCommit.substring(0, 8)}`;
  console.log(`${colors.green}Build ID: ${buildId}${colors.reset}`);
  
  // Step 2: Create a unique marker file that will force Cloudflare to see the repo as changed
  const deployMarkerPath = 'DEPLOY_TRIGGER.txt';
  fs.writeFileSync(deployMarkerPath, `Force deployment triggered at ${timestamp}\nBuild ID: ${buildId}\n`);
  
  // Step 3: Add, commit, and push the marker file
  console.log(`${colors.yellow}Committing and pushing deployment trigger...${colors.reset}`);
  
  execSync('git add DEPLOY_TRIGGER.txt', { stdio: 'inherit' });
  execSync(`git commit -m "Force deployment: ${buildId}"`, { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  
  console.log(`${colors.bright}${colors.green}Deployment trigger pushed to repository.${colors.reset}`);
  console.log(`${colors.bright}${colors.green}Cloudflare should detect the change and start a new deployment.${colors.reset}`);
  console.log(`${colors.yellow}Note: It may take a few minutes for Cloudflare to process the deployment.${colors.reset}`);
  
} catch (error) {
  console.error(`${colors.red}Deployment trigger failed: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
} 