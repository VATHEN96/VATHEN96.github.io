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
  // Step 1: Create a package.json that preserves ESM compatibility
  console.log(`${colors.yellow}Creating deployment-specific package.json...${colors.reset}`);
  
  // Create a modified package.json for deployment
  const deployPackageJson = {
    ...originalPackageJson,
    // Preserve the ESM module type - Next.js Route Handlers require it
    type: "module", 
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
  
  // Step 2: Create a tsconfig.json that's compatible with both ESM and CommonJS
  console.log(`${colors.yellow}Creating ESM/CommonJS-compatible tsconfig.json...${colors.reset}`);
  
  // Backup original tsconfig if it exists
  if (fs.existsSync('tsconfig.json')) {
    fs.copyFileSync('tsconfig.json', 'tsconfig.json.bak');
  }
  
  // Create a deployment-specific tsconfig
  const tsConfig = {
    "compilerOptions": {
      "target": "es5",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": false,
      "forceConsistentCasingInFileNames": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext", // Next.js requires esnext module format
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  };
  
  fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfig, null, 2));
  
  // Step 3: Delete any lock files to prevent package manager conflicts
  console.log(`${colors.yellow}Removing any existing lock files...${colors.reset}`);
  ['pnpm-lock.yaml', 'yarn.lock'].forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`${colors.green}Removed ${file}${colors.reset}`);
    }
  });

  // Step 4: Install dependencies with npm
  console.log(`${colors.yellow}Installing dependencies with npm...${colors.reset}`);
  execSync('npm install --no-audit --no-fund --legacy-peer-deps', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development' // Use development mode for the install step
    }
  });

  // Step 5: Create a next.config.js file that handles both ESM and CommonJS modules
  console.log(`${colors.yellow}Creating mixed module format next.config.js...${colors.reset}`);
  
  const nextConfigJs = `
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    // Disable TypeScript during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  experimental: {
    // Enable transpilation of server components
    serverComponentsExternalPackages: [],
    // Enable support for mixed modules
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  webpack: (config, { isServer }) => {
    // Support import/export in both CommonJS and ESM files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Handle .js files (allow ESM in .js files)
    config.module.rules.push({
      test: /\\.js$/,
      use: [{
        loader: 'next-swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'ecmascript',
              jsx: true,
              dynamicImport: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
              },
            },
          },
        },
      }],
      include: [/pages/, /app/, /components/],
      exclude: /node_modules/,
    });
    
    // Handle .mjs explicitly as ESM
    config.module.rules.push({
      test: /\\.mjs$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: true,
      },
    });
    
    // Add necessary polyfills
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "fs": false,
      "net": false,
      "tls": false,
      "http": "stream-http",
      "https": "https-browserify",
      "stream": "stream-browserify",
      "crypto": "crypto-browserify",
      "zlib": "browserify-zlib",
      "path": "path-browserify",
      "buffer": "buffer",
      "querystring": "querystring-es3"
    };
    
    return config;
  },
  // Support both .js and .mjs files
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mjs'],
};

export default nextConfig;
`;

  fs.writeFileSync('next.config.mjs', nextConfigJs);
  
  // Step 6: Run the Next.js build with ESM support
  console.log(`${colors.yellow}Building Next.js app with mixed module support...${colors.reset}`);
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_ENV: 'production',
      NEXT_IGNORE_TYPE_ERROR: '1',
      NEXT_IGNORE_ESLINT_ERROR: '1'
    }
  });

  // Step 7: Create .nojekyll file for GitHub Pages
  console.log(`${colors.yellow}Creating .nojekyll file...${colors.reset}`);
  fs.writeFileSync('.next/.nojekyll', '');

  // Step 8: Restore the original files
  console.log(`${colors.yellow}Restoring original files...${colors.reset}`);
  if (fs.existsSync('package.json.bak')) {
    fs.copyFileSync('package.json.bak', 'package.json');
    fs.unlinkSync('package.json.bak');
  }
  
  if (fs.existsSync('tsconfig.json.bak')) {
    fs.copyFileSync('tsconfig.json.bak', 'tsconfig.json');
    fs.unlinkSync('tsconfig.json.bak');
  }

  // Step 9: Done
  console.log(`${colors.bright}${colors.green}Build completed successfully!${colors.reset}`);
  process.exit(0);
} catch (error) {
  console.error(`${colors.red}Build failed: ${error.message}${colors.reset}`);
  console.error(error.stack);
  
  // Try to restore original files if they exist
  console.log(`${colors.yellow}Restoring original files after failure...${colors.reset}`);
  if (fs.existsSync('package.json.bak')) {
    fs.copyFileSync('package.json.bak', 'package.json');
    fs.unlinkSync('package.json.bak');
  }
  
  if (fs.existsSync('tsconfig.json.bak')) {
    fs.copyFileSync('tsconfig.json.bak', 'tsconfig.json');
    fs.unlinkSync('tsconfig.json.bak');
  }
  
  process.exit(1);
} 