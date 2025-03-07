const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(`${colors.bright}${colors.blue}Starting Cloudflare Pages build process...${colors.reset}`);

try {
  // Step 1: Install dependencies without TypeScript checks
  console.log(`${colors.yellow}Installing dependencies...${colors.reset}`);
  execSync('npm install --no-audit --prefer-offline --no-fund --legacy-peer-deps', {
    stdio: 'inherit',
  });

  // Step 2: Clear any previous build files
  console.log(`${colors.yellow}Cleaning up previous build files...${colors.reset}`);
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }

  // Step 3: Run the Next.js build with TypeScript checks disabled
  console.log(`${colors.yellow}Building Next.js app without TypeScript checks...${colors.reset}`);
  const nextBuildCmd = 'NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production next build';
  execSync(nextBuildCmd, { stdio: 'inherit' });

  // Step 4: Create a .nojekyll file to disable GitHub Pages Jekyll processing
  console.log(`${colors.yellow}Creating .nojekyll file...${colors.reset}`);
  fs.writeFileSync('.next/.nojekyll', '');

  // Step 5: Done
  console.log(`${colors.bright}${colors.green}Build completed successfully!${colors.reset}`);
  process.exit(0);
} catch (error) {
  console.error(`${colors.red}Build failed: ${error.message}${colors.reset}`);
  process.exit(1);
} 