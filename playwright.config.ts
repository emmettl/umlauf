import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  reporter: process.env.CI
    ? [
        ['list'],
        ['github'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['./scripts/playwright-summary-reporter.mjs'],
      ]
    : 'list',
  testDir:'./tests/browser',fullyParallel:true,timeout:process.env.CI?60_000:30_000,use:{baseURL:process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:4177',trace:'retain-on-failure',screenshot:'only-on-failure'},projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'phone',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],webServer:{command:process.env.PLAYWRIGHT_SERVER_COMMAND??'npm run dev',url:process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:4177',reuseExistingServer:true}})
