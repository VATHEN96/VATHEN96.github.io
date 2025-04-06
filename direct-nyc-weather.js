/**
 * Direct AccuWeather Automation
 * 
 * Uses Playwright directly to check New York City weather on AccuWeather
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Screenshot directory
const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function getNYCWeather() {
  // Launch a new browser
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate directly to New York City weather page
    console.log('Navigating to NYC weather page...');
    await page.goto('https://www.accuweather.com/en/us/new-york/10007/weather-forecast/349727');
    
    // Wait for the page to load
    console.log('Waiting for weather data to load...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.temp');
    
    // Take a screenshot
    console.log('Taking screenshot...');
    const screenshotPath = path.join(screenshotDir, 'nyc-weather.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Get the current temperature
    console.log('Getting current temperature...');
    const tempElement = await page.$('.temp');
    let temperature = 'N/A';
    
    if (tempElement) {
      temperature = await tempElement.textContent();
      console.log('Current temperature in New York City:', temperature);
    } else {
      console.log('Could not find temperature element');
    }
    
    return {
      temperature,
      screenshotPath
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the function
getNYCWeather()
  .then(result => {
    console.log('✅ Successfully checked NYC weather');
    console.log(result);
  })
  .catch(error => {
    console.error('❌ Failed to check NYC weather:', error);
  }); 