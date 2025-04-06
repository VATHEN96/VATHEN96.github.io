import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Maximum time one test can run for
  timeout: 30 * 1000,
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000
  },
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retries if test fails
  retries: process.env.CI ? 2 : 0,
  // Number of workers for parallel testing
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: 'html',
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
  },
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  // Web server to start before running tests
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
}); 