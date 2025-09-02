const { defineConfig, devices } = require('@playwright/test');

/**
 * Optimized Playwright Configuration for Tamil Language Society Project
 * - Fast execution with Chromium only by default
 * - Reasonable timeouts to prevent hanging
 * - Proper server configuration for frontend testing
 * - Enhanced reporting for debugging
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Sequential execution to prevent resource overload */
  fullyParallel: false,
  
  /* Fail fast on test.only in CI */
  forbidOnly: !!process.env.CI,
  
  /* Limited retries to prevent long execution times */
  retries: process.env.CI ? 1 : 0,
  
  /* Single worker for stability */
  workers: 1,
  
  /* Enhanced reporting */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  
  /* Optimized settings */
  use: {
    /* Frontend server URL */
    baseURL: 'http://localhost:5000',
    
    /* Always collect traces for debugging */
    trace: 'retain-on-failure',
    
    /* Screenshots and videos for failed tests */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Optimized timeouts to prevent hanging */
  actionTimeout: 3000,
  navigationTimeout: 10000,
    
    /* Headless by default, can override with --headed */
    headless: !process.env.HEADED,
    
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
  },

  /* Optimized browser configuration - Chromium only by default */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Additional Chrome args for stability */
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--no-sandbox'
          ]
        }
      },
    },
    
    /* Optional browsers - uncomment to enable */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* No automatic server startup - servers should be running manually */
  // webServer: {
  //   command: 'npm start',
  //   url: 'http://localhost:8080',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30000,
  // },

  /* Optimized global timeout */
  timeout: 10000,
  
  /* Fast expect timeout */
  expect: {
    timeout: 3000,
  },
  
  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),
});