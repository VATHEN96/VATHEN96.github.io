const { chromium } = require('playwright');

async function comprehensiveTest() {
  console.log('Starting comprehensive test for WowzaRush dApp');
  
  // Launch browser with DevTools for debugging
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 200 // Slow down operations for better visibility
  });
  
  // Create a new context
  const context = await browser.newContext();
  
  // Create a new page
  const page = await context.newPage();
  
  // Set up detailed console logging for better debugging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error(`BROWSER CONSOLE ERROR: ${text}`);
    } else if (type === 'warning') {
      console.warn(`BROWSER CONSOLE WARNING: ${text}`);
    } else {
      console.log(`BROWSER CONSOLE ${type.toUpperCase()}: ${text}`);
    }
  });
  
  // Listen for all page errors
  page.on('pageerror', error => {
    console.error(`BROWSER PAGE ERROR: ${error.message}`);
  });
  
  // Listen for request failures
  page.on('requestfailed', request => {
    console.error(`NETWORK REQUEST FAILED: ${request.url()} (${request.failure().errorText})`);
  });
  
  // Navigate to the dApp
  console.log('Navigating to the dApp...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  console.log('Page loaded and network is idle');
  
  try {
    // === TEST 1: WALLET CONNECTION ===
    console.log('\n=== TEST 1: WALLET CONNECTION ===');
    // Take a screenshot before attempting to connect wallet
    await page.screenshot({ path: 'before-wallet-connection.png' });
    
    // Test wallet connection - our specific fix
    console.log('Testing wallet connection with the fixed connectWallet function...');
    
    // First look for connect wallet button in the header/navbar
    let connectWalletButton = await page.getByRole('button', { name: /connect wallet/i });
    
    // If not found, try looking for it elsewhere with more general selectors
    if (!await connectWalletButton.isVisible()) {
      connectWalletButton = await page.getByText(/connect wallet/i, { exact: false });
    }
    
    if (await connectWalletButton.isVisible()) {
      console.log('Connect Wallet button found, clicking...');
      
      // Click and wait for potential MetaMask popup
      await connectWalletButton.click();
      console.log('Clicked connect wallet button, waiting for MetaMask popup...');
      
      // Wait for a reasonable amount of time for MetaMask to appear
      await page.waitForTimeout(8000);
      
      // Take screenshot after connection attempt
      await page.screenshot({ path: 'after-wallet-connection-attempt.png' });
      console.log('Screenshot taken after wallet connection attempt');
      
      // Check if we can find indicators of successful connection
      const addressDisplay = await page.getByText(/0x[a-fA-F0-9]{6,}/);
      const isConnected = await addressDisplay.isVisible();
      
      if (isConnected) {
        console.log('WALLET CONNECTION TEST: SUCCESS - Wallet successfully connected');
      } else {
        console.log('WALLET CONNECTION TEST: INCONCLUSIVE - Cannot determine if wallet connected');
        console.log('Note: You may need to manually approve the connection in MetaMask');
      }
    } else {
      console.log('WALLET CONNECTION TEST: FAILED - Connect Wallet button not found');
    }
    
    // === TEST 2: NAVIGATION ===
    console.log('\n=== TEST 2: NAVIGATION ===');
    
    // Test navigation to different pages
    const navItems = [
      { name: 'Explore', path: '/explore' },
      { name: 'Create', path: '/create' },
      { name: 'Profile', path: '/profile' }
    ];
    
    for (const item of navItems) {
      console.log(`Testing navigation to ${item.name}...`);
      
      // Try to find the navigation item
      const navItem = await page.getByRole('link', { name: new RegExp(item.name, 'i') });
      
      if (await navItem.isVisible()) {
        console.log(`${item.name} link found, clicking...`);
        await navItem.click();
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        
        // Take a screenshot of the page
        await page.screenshot({ path: `nav-${item.name.toLowerCase()}.png` });
        
        // Verify we're on the expected page
        const currentUrl = page.url();
        if (currentUrl.includes(item.path)) {
          console.log(`NAVIGATION TEST (${item.name}): SUCCESS - Navigated to ${currentUrl}`);
        } else {
          console.log(`NAVIGATION TEST (${item.name}): FAILED - Expected URL with ${item.path}, got ${currentUrl}`);
        }
      } else {
        console.log(`NAVIGATION TEST (${item.name}): FAILED - Link not found`);
      }
    }
    
    // === TEST 3: CAMPAIGN CREATION FORM ===
    console.log('\n=== TEST 3: CAMPAIGN CREATION FORM ===');
    
    // Navigate to create campaign page
    await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle' });
    console.log('Navigated to campaign creation page');
    
    // Take screenshot of the campaign creation form
    await page.screenshot({ path: 'campaign-creation-form.png' });
    
    // Test campaign form fields
    const formFields = [
      { name: 'title', value: 'Test Campaign Title' },
      { name: 'description', value: 'This is a test campaign description created by an automated test script.' },
      { name: 'category', value: 'Technology' },
      { name: 'goalAmount', value: '1' }
    ];
    
    // Fill out the form
    console.log('Filling out campaign creation form...');
    
    let formSuccess = true;
    for (const field of formFields) {
      try {
        // Look for input by label text, placeholder, or name
        const input = await page.locator(`input[name="${field.name}"], textarea[name="${field.name}"], input[placeholder*="${field.name}"], textarea[placeholder*="${field.name}"]`).first();
        
        if (await input.isVisible()) {
          await input.fill(field.value);
          console.log(`Field '${field.name}' filled with value '${field.value}'`);
        } else {
          console.log(`Field '${field.name}' not found or not visible`);
          formSuccess = false;
        }
      } catch (error) {
        console.error(`Error filling field '${field.name}':`, error.message);
        formSuccess = false;
      }
    }
    
    // Take screenshot after filling the form
    await page.screenshot({ path: 'campaign-form-filled.png' });
    
    if (formSuccess) {
      console.log('CAMPAIGN FORM TEST: SUCCESS - Form fields filled successfully');
    } else {
      console.log('CAMPAIGN FORM TEST: PARTIAL FAILURE - Some form fields could not be filled');
    }
    
    // Note: We won't submit the form to avoid creating test campaigns
    
    // === TEST 4: CAMPAIGN BROWSING ===
    console.log('\n=== TEST 4: CAMPAIGN BROWSING ===');
    
    // Navigate to explore page
    await page.goto('http://localhost:3000/explore', { waitUntil: 'networkidle' });
    console.log('Navigated to campaign explore page');
    
    // Take screenshot of the campaigns list
    await page.screenshot({ path: 'campaign-browse.png' });
    
    // Check for campaign cards
    const campaignCards = await page.locator('.campaign-card, [data-testid="campaign-card"], article, .card').all();
    
    if (campaignCards.length > 0) {
      console.log(`Found ${campaignCards.length} campaign cards`);
      console.log('CAMPAIGN BROWSING TEST: SUCCESS');
      
      // Test campaign detail view if cards exist
      console.log('\n=== TEST 5: CAMPAIGN DETAIL VIEW ===');
      console.log('Testing campaign detail view...');
      
      // Click the first campaign card
      await campaignCards[0].click();
      await page.waitForTimeout(3000);
      
      // Take screenshot of the campaign detail page
      await page.screenshot({ path: 'campaign-detail.png' });
      
      // Check if we're on a detail page by looking for expected elements
      const detailElements = await page.locator('h1, .campaign-title, .campaign-detail, .campaign-header').all();
      
      if (detailElements.length > 0) {
        console.log('CAMPAIGN DETAIL TEST: SUCCESS - Campaign detail page loaded');
      } else {
        console.log('CAMPAIGN DETAIL TEST: FAILED - Campaign detail page not loaded or elements not found');
      }
    } else {
      console.log('No campaign cards found');
      console.log('CAMPAIGN BROWSING TEST: INCONCLUSIVE - No campaigns to browse');
    }
    
    // === TEST 6: PROFILE PAGE ===
    console.log('\n=== TEST 6: PROFILE PAGE ===');
    
    // Navigate to profile page
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
    console.log('Navigated to profile page');
    
    // Take screenshot of the profile page
    await page.screenshot({ path: 'profile-page.png' });
    
    // Check for profile elements
    const profileElements = await page.locator('.profile-header, .user-profile, .account-details, h1:text("Profile")').all();
    
    if (profileElements.length > 0) {
      console.log('PROFILE PAGE TEST: SUCCESS - Profile page elements found');
    } else {
      console.log('PROFILE PAGE TEST: INCONCLUSIVE - Profile page elements not found (might require login)');
    }
    
    // === FINAL SUMMARY ===
    console.log('\n=== TEST SUMMARY ===');
    console.log('All automated tests completed');
    console.log('Screenshots have been saved for visual verification');
    console.log('Please check console output for test results');
    
  } catch (error) {
    console.error('Test script encountered an error:', error);
    await page.screenshot({ path: 'error-state.png' });
    console.log('Error screenshot saved as error-state.png');
  } finally {
    // Keep the browser open for manual inspection
    console.log('\nBrowser will remain open for manual testing and inspection');
    console.log('Press Ctrl+C in the terminal when you want to close the browser');
    
    // Uncomment the following line if you want to automatically close the browser
    // await browser.close();
  }
}

comprehensiveTest().catch(err => {
  console.error('Unhandled error in test script:', err);
  process.exit(1);
}); 