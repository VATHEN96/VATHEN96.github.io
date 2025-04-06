const { chromium } = require('playwright');

async function testDApp() {
  console.log('Starting Playwright test for WowzaRush dApp');
  
  // Launch browser with DevTools for debugging
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 100 // Slow down operations for better visibility
  });
  
  // Create a new context
  const context = await browser.newContext();
  
  // Create a new page
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`BROWSER LOG: ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.error(`BROWSER ERROR: ${error.message}`);
  });
  
  // Navigate to the dApp
  console.log('Navigating to the dApp...');
  await page.goto('http://localhost:3000/');
  console.log('Page loaded');
  
  try {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    console.log('Page fully loaded');
    
    // Test wallet connection
    console.log('Testing wallet connection...');
    const connectWalletButton = await page.getByText('Connect Wallet', { exact: false });
    
    if (await connectWalletButton.isVisible()) {
      console.log('Connect Wallet button found, clicking...');
      await connectWalletButton.click();
      
      // Wait for potential MetaMask popup or wallet connection result
      await page.waitForTimeout(5000);
      console.log('Wallet connection test attempted');
    } else {
      console.log('Connect Wallet button not found');
    }
    
    // Testing campaign creation
    console.log('Testing campaign creation...');
    const createCampaignButton = await page.getByText('Create Campaign', { exact: false });
    
    if (await createCampaignButton.isVisible()) {
      console.log('Create Campaign button found, clicking...');
      await createCampaignButton.click();
      
      // Wait for campaign creation page to load
      await page.waitForTimeout(2000);
      console.log('Campaign creation page test attempted');
    } else {
      console.log('Create Campaign button not found');
    }
    
    // Test campaign browsing
    console.log('Testing campaign browsing...');
    const exploreButton = await page.getByText('Explore', { exact: false });
    
    if (await exploreButton.isVisible()) {
      console.log('Explore button found, clicking...');
      await exploreButton.click();
      
      // Wait for campaign list page to load
      await page.waitForTimeout(2000);
      console.log('Campaign browsing test attempted');
    } else {
      console.log('Explore button not found');
    }
    
    // Test campaign detail viewing (if any campaigns exist)
    const campaignCards = await page.locator('.campaign-card').all();
    if (campaignCards.length > 0) {
      console.log(`Found ${campaignCards.length} campaigns, clicking the first one...`);
      await campaignCards[0].click();
      
      // Wait for campaign details page to load
      await page.waitForTimeout(2000);
      console.log('Campaign detail viewing test attempted');
    } else {
      console.log('No campaign cards found to test details view');
    }
    
    // Test profile page if user is connected
    console.log('Testing profile page...');
    const profileButton = await page.getByText('Profile', { exact: false });
    
    if (await profileButton.isVisible()) {
      console.log('Profile button found, clicking...');
      await profileButton.click();
      
      // Wait for profile page to load
      await page.waitForTimeout(2000);
      console.log('Profile page test attempted');
    } else {
      console.log('Profile button not found');
    }
    
    // Wait for a moment to observe the UI state
    await page.waitForTimeout(3000);
    
    // Capture a screenshot
    await page.screenshot({ path: 'dapp-test-screenshot.png' });
    console.log('Screenshot saved as dapp-test-screenshot.png');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Error screenshot saved as error-screenshot.png');
  } finally {
    // Keep the browser open for manual inspection
    console.log('Tests completed. Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C in the terminal when you want to close the browser.');
    
    // Uncomment the following line if you want to automatically close the browser
    // await browser.close();
  }
}

testDApp().catch(err => {
  console.error('Unhandled error in test script:', err);
  process.exit(1);
}); 