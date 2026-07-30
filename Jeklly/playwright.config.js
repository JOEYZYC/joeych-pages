const { defineConfig } = require('@playwright/test');

const reportRoot = process.env.PW_REPORT_ROOT || '.omo/evidence/portfolio-editorial-redesign/final/playwright';

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  outputDir: `${reportRoot}/test-results`,
  reporter: [
    ['list'],
    ['junit', { outputFile: `${reportRoot}/results.xml` }],
    ['html', { outputFolder: `${reportRoot}/report`, open: 'never' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8123/joeych-pages/',
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } }
      : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'mobile-375', use: { viewport: { width: 375, height: 812 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1280', use: { viewport: { width: 1280, height: 900 } } },
  ],
});
