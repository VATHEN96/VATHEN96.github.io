#!/usr/bin/env node

const { execSync } = require('child_process');

// Configuration
const PROJECT_NAME = 'vathen96-github-io';
const API_TOKEN = 'v1rm2Cdh5zbfpNBcl2E6LJjFLWtUJvPW1CpZkesn';
const ACCOUNT_ID = 'e983fa0f1c49daef1c51ede34f58fd83';
const BATCH_SIZE = 20; // Number of deployments to delete in a batch

// Function to fetch deployments with pagination
function fetchDeployments(page = 1, perPage = 50) {
  try {
    console.log(`Fetching deployments page ${page} (${perPage} per page)...`);
    const result = execSync(
      `curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments?page=${page}&per_page=${perPage}" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

    try {
      const response = JSON.parse(result);
      if (!response.success) {
        console.error('Failed to fetch deployments:', response.errors);
        return [];
      }

      return response.result;
    } catch (e) {
      console.error('Error parsing JSON response:', e.message);
      console.log('Raw response:', result);
      return [];
    }
  } catch (error) {
    console.error('Error fetching deployments:', error.message);
    return [];
  }
}

// Function to delete a deployment
function deleteDeployment(deploymentId) {
  try {
    console.log(`Deleting deployment ${deploymentId}...`);
    
    const result = execSync(
      `curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${deploymentId}" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

    try {
      const response = JSON.parse(result);
      if (response.success) {
        console.log(`Successfully deleted deployment ${deploymentId}`);
        return true;
      } else {
        console.error(`Failed to delete deployment ${deploymentId}:`, response.errors);
        return false;
      }
    } catch (e) {
      console.log(`Received non-JSON response: ${result}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting deployment ${deploymentId}:`, error.message);
    return false;
  }
}

// Function to check for custom domains
function checkCustomDomains() {
  try {
    console.log('Checking for custom domains...');
    
    const result = execSync(
      `curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

    try {
      const response = JSON.parse(result);
      if (!response.success) {
        console.error('Failed to fetch custom domains:', response.errors);
        return [];
      }

      return response.result;
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching custom domains:', error.message);
    return [];
  }
}

// Function to delete a custom domain
function deleteCustomDomain(domain) {
  try {
    console.log(`Deleting custom domain ${domain.name}...`);
    
    const result = execSync(
      `curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains/${domain.id}" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

    try {
      const response = JSON.parse(result);
      if (response.success) {
        console.log(`Successfully deleted custom domain ${domain.name}`);
      } else {
        console.error(`Failed to delete custom domain ${domain.name}:`, response.errors);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  } catch (error) {
    console.error(`Error deleting custom domain ${domain.name}:`, error.message);
  }
}

// Function to delete the project
function deleteProject() {
  try {
    console.log(`Deleting project ${PROJECT_NAME}...`);
    
    const result = execSync(
      `curl -s -X DELETE "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json"`,
      { encoding: 'utf-8' }
    );

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
      console.log(`Received non-JSON response: ${result}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting project ${PROJECT_NAME}:`, error.message);
    return false;
  }
}

// Function to delay execution
function delay(ms) {
  console.log(`Waiting ${ms}ms...`);
  const start = new Date().getTime();
  while (new Date().getTime() < start + ms) {
    // Do nothing, just wait
  }
}

// Process deployments in batches to avoid overloading the API
async function processDeployments() {
  let allDeployments = [];
  let page = 1;
  const perPage = 100;
  let fetchedDeployments;
  
  // Fetch all deployments using pagination
  do {
    fetchedDeployments = fetchDeployments(page, perPage);
    console.log(`Fetched ${fetchedDeployments.length} deployments from page ${page}`);
    allDeployments = allDeployments.concat(fetchedDeployments);
    page++;
    
    // Add a delay between pagination requests
    delay(500);
  } while (fetchedDeployments.length === perPage);
  
  console.log(`Found a total of ${allDeployments.length} deployments`);
  
  // Process deployments in batches
  for (let i = 0; i < allDeployments.length; i += BATCH_SIZE) {
    const batch = allDeployments.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(allDeployments.length / BATCH_SIZE)} (${batch.length} deployments)`);
    
    // Delete deployments in this batch
    for (const deployment of batch) {
      try {
        deleteDeployment(deployment.id);
      } catch (error) {
        console.error(`Error during deletion of deployment ${deployment.id}:`, error.message);
      }
      // Add a delay between deletions
      delay(250);
    }
    
    // Add a longer delay between batches
    if (i + BATCH_SIZE < allDeployments.length) {
      console.log('Taking a longer break between batches...');
      delay(2000);
    }
  }
}

// Main function
async function main() {
  try {
    // First, remove any custom domains
    const customDomains = checkCustomDomains();
    console.log(`Found ${customDomains.length} custom domains`);
    
    for (const domain of customDomains) {
      deleteCustomDomain(domain);
      delay(500);
    }
    
    // Delete deployments in batches
    await processDeployments();
    
    // Try to delete the project
    console.log('Attempting to delete the project...');
    const success = deleteProject();
    
    if (success) {
      console.log('Project cleanup completed successfully!');
    } else {
      console.log('Failed to delete project. Some resources may still exist.');
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}

// Run the script
main(); 