#!/usr/bin/env node

const { execSync } = require('child_process');

// Configuration
const PROJECT_NAME = 'vathen96-github-io';
const API_TOKEN = 'v1rm2Cdh5zbfpNBcl2E6LJjFLWtUJvPW1CpZkesn';
const ACCOUNT_ID = 'e983fa0f1c49daef1c51ede34f58fd83';

// Function to force delete the project
function forceDeleteProject() {
  try {
    console.log(`Attempting to force delete project ${PROJECT_NAME}...`);
    
    // Using the -v flag to see what's happening with the request
    const result = execSync(
      `curl -v -X DELETE "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}?force=true" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

    console.log("API Response:", result);
    
    try {
      const response = JSON.parse(result);
      if (response.success) {
        console.log(`Successfully deleted project ${PROJECT_NAME}`);
        return true;
      } else {
        console.error(`Failed to delete project ${PROJECT_NAME}:`, response.errors);
        return false;
      }
    } catch (e) {
      console.log(`Received non-JSON response`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting project ${PROJECT_NAME}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log("Attempting to force delete the project with all its deployments...");
  forceDeleteProject();
}

// Run the script
main(); 