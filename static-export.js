#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Create backup directory
const backupDir = path.join(__dirname, 'backup-cf-deploy');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

function backupFile(filename) {
  if (fs.existsSync(filename)) {
    const backupPath = path.join(backupDir, path.basename(filename));
    fs.copyFileSync(filename, backupPath);
    console.log(`${colors.yellow}Backed up ${filename} to ${backupPath}${colors.reset}`);
    return true;
  }
  return false;
}

function restoreFile(filename) {
  const backupPath = path.join(backupDir, path.basename(filename));
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filename);
    console.log(`${colors.yellow}Restored ${filename} from backup${colors.reset}`);
  }
}

// Backup key files
console.log(`${colors.cyan}Backing up original configuration files...${colors.reset}`);
const hasPackageJson = backupFile('package.json');
const hasNextConfig = backupFile('next.config.js');
const hasTsConfig = backupFile('tsconfig.json');

// Clean up previous builds
console.log(`${colors.cyan}Cleaning up previous builds...${colors.reset}`);
if (fs.existsSync('out')) {
  fs.rmSync('out', { recursive: true, force: true });
}
if (fs.existsSync('.next')) {
  fs.rmSync('.next', { recursive: true, force: true });
}

// Create a minimal package.json for static export
console.log(`${colors.cyan}Creating optimized package.json for static export...${colors.reset}`);
const packageJson = {
  "name": "wowzarush",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build && next export"
  },
  "dependencies": {
    "next": "^13.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Create next.config.js for static export
console.log(`${colors.cyan}Creating next.config.js for static export...${colors.reset}`);
const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

module.exports = nextConfig;
`;
fs.writeFileSync('next.config.js', nextConfig);

// Create tsconfig.json
console.log(`${colors.cyan}Creating tsconfig.json for static export...${colors.reset}`);
const tsConfig = {
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
};
fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 2));

// Install dependencies and build static export
try {
  console.log(`${colors.cyan}Installing required dependencies...${colors.reset}`);
  execSync('npm install --no-package-lock', { stdio: 'inherit' });
  
  console.log(`${colors.cyan}Building static export...${colors.reset}`);
  execSync('npx next build && npx next export', { stdio: 'inherit' });
  
  // Create Cloudflare Pages configuration
  console.log(`${colors.cyan}Creating Cloudflare Pages configuration...${colors.reset}`);
  
  // Add _routes.json for Cloudflare Pages
  const routesConfig = {
    "version": 1,
    "include": ["/*"],
    "exclude": []
  };
  fs.writeFileSync('out/_routes.json', JSON.stringify(routesConfig, null, 2));
  
  // Add static HTML fallback for client-side routing
  fs.copyFileSync('out/index.html', 'out/404.html');
  
  // Add _headers file for cache control
  fs.writeFileSync('out/_headers', `/*
  Cache-Control: public, max-age=0, must-revalidate
`);

  console.log(`${colors.green}Static export complete! The 'out' directory is ready for deployment.${colors.reset}`);
  console.log(`${colors.green}Deploy command: wrangler pages deploy out --project-name=wowzarush${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Build failed:${colors.reset}`, error);
} finally {
  // Restore original files
  console.log(`${colors.cyan}Restoring original configuration...${colors.reset}`);
  if (hasPackageJson) restoreFile('package.json');
  if (hasNextConfig) restoreFile('next.config.js');
  if (hasTsConfig) restoreFile('tsconfig.json');
} 