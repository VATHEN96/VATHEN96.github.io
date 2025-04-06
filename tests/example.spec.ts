import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Check that the page has a title
  const title = await page.title();
  expect(title).toBeTruthy();
  
  // Take a screenshot
  await page.screenshot({ path: 'homepage.png' });
}); 