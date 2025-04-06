/**
 * Reset Development Environment Script
 * 
 * This script helps clear caches and restart the development server
 * to resolve common Next.js development issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}=== WowzaRush Development Environment Reset ====${colors.reset}`);
console.log(`${colors.yellow}This script will clean up your development environment${colors.reset}`);

try {
  // Step 1: Remove Next.js cache and build files
  const directories = [
    '.next',
    'node_modules/.cache',
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`${colors.yellow}Removing ${dir}...${colors.reset}`);
      try {
        if (process.platform === 'win32') {
          // Windows needs special handling for directory removal
          execSync(`rd /s /q "${dirPath}"`, { stdio: 'inherit' });
        } else {
          execSync(`rm -rf "${dirPath}"`, { stdio: 'inherit' });
        }
        console.log(`${colors.green}✓ Successfully removed ${dir}${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}Failed to remove ${dir}: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.blue}Directory ${dir} does not exist, skipping...${colors.reset}`);
    }
  });

  // Step 2: Reinstall node modules (optional - uncomment if needed)
  /*
  console.log(`${colors.yellow}Reinstalling node modules...${colors.reset}`);
  try {
    execSync('npm ci', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Successfully reinstalled node modules${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to reinstall node modules: ${error.message}${colors.reset}`);
  }
  */

  // Step 3: Start the development server
  console.log(`${colors.green}Starting development server...${colors.reset}`);
  console.log(`${colors.magenta}Press Ctrl+C to stop the server${colors.reset}`);
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error(`${colors.red}An error occurred: ${error.message}${colors.reset}`);
  process.exit(1);
} 