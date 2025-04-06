/**
 * NYC Weather Check Script
 * 
 * This script navigates to AccuWeather, searches for New York City,
 * and captures the current temperature
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Server configuration
const SERVER_URL = 'http://localhost:3000';

// Screenshot directory
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function makeRequest(endpoint, data = {}) {
  try {
    const response = await axios.post(`${SERVER_URL}${endpoint}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    throw error;
  }
}

async function checkNYCWeather() {
  try {
    console.log('Starting NYC weather check...');
    
    // Step 1: Launch browser
    console.log('Launching browser...');
    await makeRequest('/launch');
    
    // Step 2: Navigate to AccuWeather
    console.log('Navigating to AccuWeather...');
    await makeRequest('/navigate', { url: 'https://www.accuweather.com/' });
    
    // Step 3: Wait for page to load
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 4: Search for New York City
    console.log('Searching for New York City...');
    await makeRequest('/execute', { 
      command: `
        // Find and click the search input
        const searchInput = await page.waitForSelector('.search-input');
        await searchInput.click();
        await searchInput.type('New York City');
        await page.keyboard.press('Enter');

        // Wait for search results
        await page.waitForSelector('.locations-list a', { timeout: 10000 });
        
        // Click on first result (NYC)
        const firstResult = await page.waitForSelector('.locations-list a');
        await firstResult.click();

        // Wait for weather page to load
        await page.waitForSelector('.cur-con-weather-card', { timeout: 15000 });
      `
    });
    
    // Step 5: Wait for weather page to fully load
    console.log('Waiting for weather data to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 6: Take screenshot of the weather page
    console.log('Taking screenshot of NYC weather page...');
    const screenshotResult = await makeRequest('/screenshot', { fullPage: false });
    console.log(`Screenshot saved to: ${screenshotResult.screenshotPath}`);
    
    // Step 7: Get the current temperature
    console.log('Extracting current temperature...');
    const tempResult = await makeRequest('/execute', {
      command: `
        const tempElement = await page.$('.temp');
        return tempElement ? await tempElement.textContent() : 'Temperature not found';
      `
    });
    
    console.log('✅ Current temperature in New York City:', tempResult.result);
    
    // Step 8: Close browser
    console.log('Closing browser...');
    await makeRequest('/close');
    
    console.log('NYC weather check completed successfully!');
    return {
      temperature: tempResult.result,
      screenshotPath: screenshotResult.screenshotPath
    };
    
  } catch (error) {
    console.error('Error in NYC weather check:', error);
    // Try to close browser if there's an error
    try {
      await makeRequest('/close');
    } catch (e) {
      // Ignore errors when closing
    }
    throw error;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  checkNYCWeather()
    .then(result => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { checkNYCWeather }; 