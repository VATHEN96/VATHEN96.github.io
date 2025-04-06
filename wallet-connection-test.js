const { chromium } = require('playwright');

/**
 * Specialized script to test the wallet connection fix
 * This test specifically focuses on the blockchainService.connectWallet method
 * that was fixed in BlockchainServiceFixedV3
 */
async function testWalletConnection() {
  console.log('Starting wallet connection test for WowzaRush dApp');
  
  // Launch browser with DevTools for debugging
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 100 // Slow down operations for better visibility
  });
  
  // Create a new context
  const context = await browser.newContext();
  
  // Create a new page with expanded console logging
  const page = await context.newPage();
  
  // Set up custom console handler for detailed debugging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.error(`BROWSER ERROR: ${text}`);
    } else if (type === 'warning') {
      console.warn(`BROWSER WARNING: ${text}`);
    } else if (text.includes('connectWallet') || text.includes('wallet') || text.includes('blockchainService')) {
      // Highlight important logs related to our fix
      console.log(`IMPORTANT - ${type.toUpperCase()}: ${text}`);
    } else {
      console.log(`BROWSER ${type.toUpperCase()}: ${text}`);
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.error(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    // Navigate to the dApp
    console.log('Navigating to the dApp...');
    await page.goto('http://localhost:3000/');
    console.log('Page loaded, waiting for network idle...');
    await page.waitForLoadState('networkidle');
    console.log('Network is idle, page fully loaded');
    
    // Take a screenshot before attempting to connect
    await page.screenshot({ path: 'wallet-test-before.png' });
    
    // Set up intercepting network requests to look for blockchain service calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('eth') || url.includes('web3') || url.includes('provider')) {
        console.log(`NETWORK REQUEST (Blockchain related): ${url}`);
      }
    });
    
    // Set up a window object listener to expose debug info
    await page.evaluate(() => {
      // Debug helper to expose window.ethereum state
      window._debugEthereum = () => {
        const info = {
          exists: !!window.ethereum,
          selectedAddress: window.ethereum?.selectedAddress,
          isConnected: window.ethereum?.isConnected?.(),
          chainId: window.ethereum?.chainId,
        };
        console.log('ETHEREUM DEBUG INFO:', JSON.stringify(info));
        return info;
      };
      
      // Log when window.ethereum gets accessed
      const originalEthereum = window.ethereum;
      Object.defineProperty(window, 'ethereum', {
        get: function() {
          console.log('window.ethereum accessed');
          return originalEthereum;
        }
      });
    });
    
    // Find and click the connect wallet button
    console.log('Looking for the connect wallet button...');
    
    // Try different selectors to find the button
    const selectors = [
      'button:has-text("Connect Wallet")',
      'a:has-text("Connect Wallet")',
      '[data-testid="connect-wallet"]',
      '.connect-wallet',
      'button:has-text("connect wallet")',
    ];
    
    let connectWalletButton = null;
    for (const selector of selectors) {
      const button = await page.locator(selector).first();
      if (await button.isVisible()) {
        connectWalletButton = button;
        console.log(`Found connect wallet button using selector: ${selector}`);
        break;
      }
    }
    
    if (!connectWalletButton) {
      // Try one more approach with getByRole
      connectWalletButton = await page.getByRole('button', { name: /connect wallet/i });
      if (await connectWalletButton.isVisible()) {
        console.log('Found connect wallet button using getByRole');
      } else {
        throw new Error('Could not find the connect wallet button using any selector');
      }
    }
    
    // Execute debug helper to check Ethereum status before clicking
    await page.evaluate(() => window._debugEthereum());
    
    // Click the connect wallet button
    console.log('Clicking connect wallet button...');
    await connectWalletButton.click();
    console.log('Connect wallet button clicked');
    
    // Wait for MetaMask popup and potential connection
    console.log('Waiting for MetaMask popup and connection process...');
    await page.waitForTimeout(10000); // Long wait to allow manual MetaMask interaction
    
    // Take a screenshot after connection attempt
    await page.screenshot({ path: 'wallet-test-after.png' });
    
    // Execute debug helper to check Ethereum status after connection attempt
    const ethereumStatus = await page.evaluate(() => window._debugEthereum());
    console.log('Ethereum status after connection attempt:', ethereumStatus);
    
    // Check console logs for any errors related to our fix
    console.log('Checking for any console errors related to connectWallet...');
    
    // Check if we can find the wallet address on the page (signifies successful connection)
    const addressPattern = /0x[a-fA-F0-9]{40}/;
    const addressElements = await page.locator(`text=${addressPattern}`).all();
    
    if (addressElements.length > 0) {
      console.log('WALLET CONNECTION TEST: SUCCESS - Wallet address found on page');
      console.log('Our fix for blockchainService.connectWallet appears to be working correctly');
    } else if (ethereumStatus.selectedAddress) {
      console.log('WALLET CONNECTION TEST: PARTIAL SUCCESS - Ethereum connected but address not displayed on page');
      console.log('The wallet connection itself worked, but UI may not be updated properly');
    } else {
      console.log('WALLET CONNECTION TEST: INCONCLUSIVE - Could not determine if wallet connected');
      console.log('You may need to manually approve the connection in MetaMask popup');
    }
    
    // Wait for user inspection
    console.log('\nTest complete. Browser will remain open for manual inspection.');
    console.log('Please check the screenshots and console output for details.');
    console.log('Press Ctrl+C in the terminal when you want to close the browser.');
    
    // Keep browser open for manual testing
    await page.waitForTimeout(3600000); // Wait for up to 1 hour for manual testing
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'wallet-test-error.png' });
  } finally {
    // Uncomment to close the browser automatically
    // await browser.close();
  }
}

testWalletConnection().catch(err => {
  console.error('Unhandled error in test script:', err);
  process.exit(1);
}); 