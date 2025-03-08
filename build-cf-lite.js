#!/usr/bin/env node

// Lightweight build script for Cloudflare Pages
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Use simpler logging without colors to reduce complexity
function log(message) {
  console.log(`[CLOUDFLARE BUILD] ${message}`);
}

log("Starting lightweight Cloudflare Pages build process...");

try {
  // Generate build ID
  const buildId = new Date().toISOString();
  log(`Build ID: ${buildId}`);

  // Clean existing build files
  log("Cleaning previous build artifacts...");
  ['.next', '.next-cf'].forEach(dir => {
    if (fs.existsSync(dir)) {
      log(`Removing ${dir} directory`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Check if we have a simplified package.json
  if (fs.existsSync('cloudflare-package.json')) {
    log("Using optimized package.json for Cloudflare...");
    if (fs.existsSync('package.json')) {
      fs.copyFileSync('package.json', 'package.json.original');
    }
    fs.copyFileSync('cloudflare-package.json', 'package.json');
  }

  // Create a basic next.config.js file
  log("Creating simplified next.config.mjs...");
  
  const nextConfigJs = `
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    },
  },
  // Use .next as the build directory
  distDir: '.next',
  // Preserve dynamic API routes
  output: 'standalone',
  // Add custom build ID to force fresh builds
  generateBuildId: async () => {
    return "${buildId}";
  },
};

export default nextConfig;
`;

  fs.writeFileSync('next.config.mjs', nextConfigJs);
  
  // Create a .env file with key settings
  log("Creating build-specific .env file...");
  
  const envContent = `
# Build environment settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_IGNORE_TYPE_ERROR=1
NEXT_IGNORE_ESLINT_ERROR=1
# Force fresh build cache
NEXT_BUILD_ID=${buildId}
`;

  // Backup original .env if it exists
  if (fs.existsSync('.env')) {
    fs.copyFileSync('.env', '.env.bak');
  }
  
  fs.writeFileSync('.env', envContent);
  
  // Run the Next.js build with simplified config
  log("Building Next.js app without TypeScript checks...");
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      NODE_ENV: 'production',
      NEXT_IGNORE_TYPE_ERROR: '1',
      NEXT_IGNORE_ESLINT_ERROR: '1',
      NEXT_BUILD_ID: buildId
    }
  });

  // Create .nojekyll file
  log("Creating .nojekyll file...");
  fs.writeFileSync('.next/.nojekyll', '');
  
  // Create verification file
  log("Creating deployment verification file...");
  const verificationContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Fresh Deployment Verification</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0070f3; }
    .info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .timestamp { font-weight: bold; color: #d400ff; }
  </style>
</head>
<body>
  <h1>Deployment Verification</h1>
  <div class="info">
    <p>This file confirms you are viewing the latest deployment.</p>
    <p>Build Timestamp: <span class="timestamp">${new Date().toString()}</span></p>
    <p>Build ID: <span class="timestamp">${buildId}</span></p>
    <p>Project: <span class="timestamp">wowzarush</span></p>
  </div>
  <p>Return to <a href="/">homepage</a></p>
</body>
</html>
`;
  fs.writeFileSync('.next/verify.html', verificationContent);

  // Create cache control headers
  log("Creating Cloudflare cache control headers...");
  const headersContent = `
# Cloudflare cache control
/*
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
`;
  fs.writeFileSync('.next/_headers', headersContent);

  // Restore original files
  log("Restoring original files...");
  if (fs.existsSync('package.json.original')) {
    fs.copyFileSync('package.json.original', 'package.json');
    fs.unlinkSync('package.json.original');
  }
  
  if (fs.existsSync('.env.bak')) {
    fs.copyFileSync('.env.bak', '.env');
    fs.unlinkSync('.env.bak');
  }

  log("Build completed successfully!");
  log(`Build ID: ${buildId}`);
  process.exit(0);
} catch (error) {
  console.error(`Build failed: ${error.message}`);
  console.error(error.stack);
  
  // Try to restore original files if they exist
  if (fs.existsSync('package.json.original')) {
    fs.copyFileSync('package.json.original', 'package.json');
    fs.unlinkSync('package.json.original');
  }
  
  if (fs.existsSync('.env.bak')) {
    fs.copyFileSync('.env.bak', '.env');
    fs.unlinkSync('.env.bak');
  }
  
  process.exit(1);
} 