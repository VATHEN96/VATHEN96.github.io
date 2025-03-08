#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const PROJECT_NAME = 'vathen96-github-io';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN; // Set this as an environment variable
const ACCOUNT_ID = 'e983fa0f1c49daef1c51ede34f58fd83'; // From your error messages

// Ensure API token is set
if (!API_TOKEN) {
  console.error('Please set the CLOUDFLARE_API_TOKEN environment variable');
  process.exit(1);
}

// Function to fetch deployments
async function fetchDeployments() {
  try {
    const result = execSync(
      `curl -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

    const response = JSON.parse(result);
    if (!response.success) {
      console.error('Failed to fetch deployments:', response.errors);
      process.exit(1);
    }

    return response.result;
  } catch (error) {
    console.error('Error fetching deployments:', error.message);
    process.exit(1);
  }
}

// Function to delete a deployment
async function deleteDeployment(deploymentId) {
  try {
    console.log(`Deleting deployment ${deploymentId}...`);
    
    const result = execSync(
      `curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${deploymentId}" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

    const response = JSON.parse(result);
    if (response.success) {
      console.log(`Successfully deleted deployment ${deploymentId}`);
    } else {
      console.error(`Failed to delete deployment ${deploymentId}:`, response.errors);
    }
  } catch (error) {
    console.error(`Error deleting deployment ${deploymentId}:`, error.message);
  }
}

// Main function
async function main() {
  // Fetch all deployments
  console.log('Fetching deployments...');
  const deployments = await fetchDeployments();
  console.log(`Found ${deployments.length} deployments`);

  // Keep the most recent deployment
  const deploymentsToDelete = deployments.slice(1);
  console.log(`Will delete ${deploymentsToDelete.length} deployments`);

  // Delete deployments (oldest first to avoid dependencies)
  for (const deployment of deploymentsToDelete.reverse()) {
    await deleteDeployment(deployment.id);
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Deployment cleanup completed!');
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 