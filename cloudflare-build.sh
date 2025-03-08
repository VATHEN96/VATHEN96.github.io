#!/bin/bash

# Increase file descriptor limits for the build
ulimit -n 4096 || echo "Could not increase file descriptor limit"

# Print ulimit information
echo "Current file descriptor limit: $(ulimit -n)"

# Install dependencies with limited concurrency
echo "Installing dependencies with limited concurrency..."
npm clean-install --progress=false --no-fund --no-audit --prefer-offline --maxsockets=5 --concurrency=1

# Run the build script if npm install succeeded
if [ $? -eq 0 ]; then
  echo "Dependencies installed successfully, running build script..."
  NODE_ENV=production DEPLOY_TIMESTAMP=$(date +%s) node build-cf.js
else
  echo "Failed to install dependencies. Trying alternative approach..."
  
  # Try yarn as an alternative
  npm install -g yarn
  yarn install --network-timeout 300000
  
  if [ $? -eq 0 ]; then
    echo "Yarn install succeeded, running build script..."
    NODE_ENV=production DEPLOY_TIMESTAMP=$(date +%s) node build-cf.js
  else
    echo "All dependency installation methods failed."
    exit 1
  fi
fi 