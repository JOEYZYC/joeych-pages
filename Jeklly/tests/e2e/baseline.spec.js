const { expect, test } = require('@playwright/test');
const { capture, resetLanguage, writeManifest } = require('./helpers');

const relevantFailures = [];

test.beforeEach(async ({ page }) => {
  relevantFailures.length = 0;
  page.on('console', (message) => {
    if (message.type() === 'error') relevantFailures.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === new URL(page.url()).origin) {
      relevantFailures.push(`network: ${response.status()} ${response.url()}`);
    }
  });
  await resetLanguage(page);
});

test.afterAll(() => {
  writeManifest();
});

test('baseline: captures the deployed homepage and certificate modal', async ({ page }, testInfo) => {
  await page.goto('index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main')).toBeVisible();
  const homepage = await capture(page, {
    projectName: testInfo.project.name,
    lang: 'zh',
    page: 'index',
    state: 'default',
  });

  await page.goto('awards.html', { waitUntil: 'domcontentloaded' });
  await page.click('[data-certs]');
  const modal = page.locator('.certificate-modal');
  await expect(modal).toBeVisible();
  const modalShot = await capture(page, {
    projectName: testInfo.project.name,
    lang: 'zh',
    page: 'awards',
    state: 'certificate-modal',
  });

  expect(homepage).toContain('.png');
  expect(modalShot).toContain('.png');
  expect(relevantFailures).toEqual([]);
});
