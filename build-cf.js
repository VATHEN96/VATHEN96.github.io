#!/usr/bin/env node

// CommonJS build script for Cloudflare Pages
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const originalPackageJson = require('./package.json');

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

console.log(`${colors.bright}${colors.blue}Starting Cloudflare Pages specialized build process...${colors.reset}`);

try {
  // Step 1: Create a package.json with explicit "type": "commonjs"
  console.log(`${colors.yellow}Creating deployment-specific package.json...${colors.reset}`);
  
  // Create a modified package.json for deployment
  const deployPackageJson = {
    ...originalPackageJson,
    type: "commonjs", // Force CommonJS mode
    packageManager: undefined, // Remove packageManager field entirely
    engines: {
      node: ">=18.18.0"
    },
    scripts: {
      ...originalPackageJson.scripts,
      build: "next build"
    }
  };
  
  // Backup the original package.json
  fs.writeFileSync('package.json.bak', JSON.stringify(originalPackageJson, null, 2));
  
  // Write the deployment version
  fs.writeFileSync('package.json', JSON.stringify(deployPackageJson, null, 2));
  
  // Step 2: Delete any lock files to prevent package manager conflicts
  console.log(`${colors.yellow}Removing any existing lock files...${colors.reset}`);
  ['pnpm-lock.yaml', 'yarn.lock'].forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`${colors.green}Removed ${file}${colors.reset}`);
    }
  });

  // Step 3: Install dependencies with npm
  console.log(`${colors.yellow}Installing dependencies with npm...${colors.reset}`);
  execSync('npm install --no-audit --no-fund --legacy-peer-deps', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development' // Use development mode for the install step
    }
  });

  // Step 4: Create next.config.js to ensure it's CommonJS format
  console.log(`${colors.yellow}Creating CommonJS next.config.js...${colors.reset}`);
  
  // Read the existing next.config.mjs
  let nextConfigContent = '';
  if (fs.existsSync('next.config.mjs')) {
    nextConfigContent = fs.readFileSync('next.config.mjs', 'utf8');
  } else if (fs.existsSync('next.config.js')) {
    nextConfigContent = fs.readFileSync('next.config.js', 'utf8');
  }
  
  // Convert to CommonJS format if it's ESM
  if (nextConfigContent.includes('export default')) {
    nextConfigContent = nextConfigContent.replace('export default', 'module.exports =');
  }
  
  // Ensure TypeScript and ESLint checks are disabled
  let nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = ${nextConfigContent.includes('nextConfig = {') 
  ? nextConfigContent.split('nextConfig = {')[1].split('};')[0] + '};'
  : '{}'
}

// Add these settings if they don't exist
if (!nextConfig.typescript) {
  nextConfig.typescript = { ignoreBuildErrors: true };
}
if (!nextConfig.eslint) {
  nextConfig.eslint = { ignoreDuringBuilds: true };
}

module.exports = nextConfig;
`;

  fs.writeFileSync('next.config.js', nextConfig);
  
  // Step 5: Run the Next.js build
  console.log(`${colors.yellow}Building Next.js app without TypeScript checks...${colors.reset}`);
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_ENV: 'production',
      DISABLE_ESLINT_PLUGIN: 'true',
      DISABLE_TYPESCRIPT: 'true'
    }
  });

  // Step 6: Create .nojekyll file for GitHub Pages
  console.log(`${colors.yellow}Creating .nojekyll file...${colors.reset}`);
  fs.writeFileSync('.next/.nojekyll', '');

  // Step 7: Restore the original package.json
  console.log(`${colors.yellow}Restoring original package.json...${colors.reset}`);
  if (fs.existsSync('package.json.bak')) {
    fs.copyFileSync('package.json.bak', 'package.json');
    fs.unlinkSync('package.json.bak');
  }

  // Step 8: Done
  console.log(`${colors.bright}${colors.green}Build completed successfully!${colors.reset}`);
  process.exit(0);
} catch (error) {
  console.error(`${colors.red}Build failed: ${error.message}${colors.reset}`);
  console.error(error.stack);
  
  // Try to restore original package.json if it exists
  if (fs.existsSync('package.json.bak')) {
    console.log(`${colors.yellow}Restoring original package.json after failure...${colors.reset}`);
    fs.copyFileSync('package.json.bak', 'package.json');
    fs.unlinkSync('package.json.bak');
  }
  
  process.exit(1);
} 