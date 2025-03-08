#!/usr/bin/env node

/**
 * Cloudflare Deploy Script
 * This script handles the specialized build process for Cloudflare Pages
 * avoiding the "too many open files" error by not using npm install.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Simple logging
function log(message) {
  console.log(`[CLOUDFLARE BUILD] ${message}`);
}

// Download a file from a URL and save it to a local path
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    log(`Downloading ${url}...`);
    const file = fs.createWriteStream(destination);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    const buildId = new Date().toISOString();
    log(`Starting Cloudflare Pages build process...`);
    log(`Build ID: ${buildId}`);
    
    // Step 1: Clean previous build artifacts
    log("Cleaning previous build artifacts...");
    ['.next', 'out'].forEach(dir => {
      if (fs.existsSync(dir)) {
        log(`Removing ${dir} directory`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    
    // Step 2: Create minimal Next.js app structure
    log("Creating minimal Next.js app structure...");
    
    // Create app directory
    if (!fs.existsSync('app')) {
      fs.mkdirSync('app', { recursive: true });
    }
    
    // Create a super minimal Next.js app
    const indexPage = `
import React from 'react';

export default function Home() {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ color: '#0070f3' }}>WowZaRush - Cloudflare Deployment</h1>
      <p>This is a minimal deployment to overcome Cloudflare Pages build limitations.</p>
      <p>The full site is coming soon.</p>
      <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Build Information</h2>
        <p>Build time: <strong>${new Date().toString()}</strong></p>
        <p>Build ID: <strong>${buildId}</strong></p>
      </div>
    </div>
  );
}
`;
    
    fs.writeFileSync('app/page.js', indexPage);
    
    // Create a minimal layout
    const layoutFile = `
export const metadata = {
  title: 'WowZaRush',
  description: 'Coming soon',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
    
    fs.writeFileSync('app/layout.js', layoutFile);
    
    // Step 3: Create next.config.js
    log("Creating next.config.js...");
    
    const nextConfigJs = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    appDir: true,
  },
  generateBuildId: async () => {
    return "${buildId}";
  },
};

module.exports = nextConfig;
`;
    
    fs.writeFileSync('next.config.js', nextConfigJs);
    
    // Step 4: Create a .env file
    log("Creating .env file...");
    
    const envContent = `
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_BUILD_ID=${buildId}
`;
    
    fs.writeFileSync('.env', envContent);
    
    // Step 5: Build the minimal app
    log("Building minimal Next.js app...");
    
    execSync('npx next build', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
      }
    });
    
    // Step 6: Create verification file
    log("Creating verification file...");
    
    const verificationContent = `
<!DOCTYPE html>
<html>
<head>
  <title>WowZaRush - Deployment Verification</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #0070f3; }
    .info { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .timestamp { font-weight: bold; color: #d400ff; }
  </style>
</head>
<body>
  <h1>WowZaRush - Deployment Verification</h1>
  <div class="info">
    <p>This is a temporary deployment to overcome Cloudflare Pages build limitations.</p>
    <p>Build Timestamp: <span class="timestamp">${new Date().toString()}</span></p>
    <p>Build ID: <span class="timestamp">${buildId}</span></p>
  </div>
  <div class="info">
    <h2>Next Steps</h2>
    <p>After you've verified this deployment is working, you can:</p>
    <ol>
      <li>Use a pre-built version of your site</li>
      <li>Build your site locally and upload only the output</li>
      <li>Consider using a different hosting platform that supports larger builds</li>
    </ol>
  </div>
  <p><a href="/">Return to homepage</a></p>
</body>
</html>
`;
    
    fs.writeFileSync('.next/verify.html', verificationContent);
    
    // Step 7: Create cache control headers
    log("Creating cache control headers...");
    
    const headersContent = `
# Cloudflare cache control
/*
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
`;
    
    fs.writeFileSync('.next/_headers', headersContent);
    
    log("Build completed successfully!");
    log(`Build ID: ${buildId}`);
    
    return 0;
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    console.error(error.stack);
    return 1;
  }
}

main().then(exitCode => {
  process.exit(exitCode);
}).catch(err => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
}); 