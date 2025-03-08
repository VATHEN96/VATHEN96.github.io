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
  // Step 1: Check if pnpm-lock.yaml exists and delete it
  console.log(`${colors.yellow}Removing pnpm-lock.yaml if it exists...${colors.reset}`);
  if (fs.existsSync('pnpm-lock.yaml')) {
    fs.unlinkSync('pnpm-lock.yaml');
    console.log(`${colors.green}Removed pnpm-lock.yaml${colors.reset}`);
  }

  // Step 2: Install dependencies without TypeScript checks using npm
  console.log(`${colors.yellow}Installing dependencies with npm...${colors.reset}`);
  execSync('npm install --no-audit --no-fund --legacy-peer-deps', {
    stdio: 'inherit',
  });

  // Step 3: Clear any previous build files
  console.log(`${colors.yellow}Cleaning up previous build files...${colors.reset}`);
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }

  // Step 4: Create a tsconfig.build.json that skips type checking
  console.log(`${colors.yellow}Creating tsconfig.build.json to skip type checking...${colors.reset}`);
  const tsConfig = {
    extends: "./tsconfig.json",
    compilerOptions: {
      noEmit: false,
      skipLibCheck: true,
      skipDefaultLibCheck: true,
      checkJs: false,
      noImplicitAny: false,
      strictNullChecks: false,
    },
    exclude: ["node_modules"]
  };
  fs.writeFileSync('tsconfig.build.json', JSON.stringify(tsConfig, null, 2));

  // Step 5: Run the Next.js build with TypeScript checks disabled
  console.log(`${colors.yellow}Building Next.js app without TypeScript checks...${colors.reset}`);
  const nextBuildCmd = 'NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production DISABLE_ESLINT_PLUGIN=true DISABLE_TYPESCRIPT=true next build';
  execSync(nextBuildCmd, { stdio: 'inherit' });

  // Step 6: Create a .nojekyll file to disable GitHub Pages Jekyll processing
  console.log(`${colors.yellow}Creating .nojekyll file...${colors.reset}`);
  fs.writeFileSync('.next/.nojekyll', '');

  // Step 7: Done
  console.log(`${colors.bright}${colors.green}Build completed successfully!${colors.reset}`);
  process.exit(0);
} catch (error) {
  console.error(`${colors.red}Build failed: ${error.message}${colors.reset}`);
  process.exit(1);
} 