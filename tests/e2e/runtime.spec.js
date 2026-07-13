const { expect, test } = require('@playwright/test');
const { crawlInternalLinks, resetLanguage } = require('./helpers');

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8123/joeych-pages/';
const routes = [
  'index.html',
  'experience.html',
  'awards.html',
  'projects.html',
  'tech-stack.html',
];
const childIconSelector = 'svg, [class*="__icon"], .home-editorial__cta-arrow';

test('runtime: rendered pages contain no Liquid leakage with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  try {
    for (const route of routes) {
      const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), route).toBe(200);
      expect(await page.content(), route).not.toMatch(/\{[{%]/);
    }
  } finally {
    await context.close();
  }
});

test('runtime: normalized internal crawler finds no malformed or failing URLs', async ({ page }) => {
  const failures = [];

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), route).toBe(200);

    const links = await crawlInternalLinks(page);
    for (const link of links) {
      expect(() => new URL(link), link).not.toThrow();
      expect(new URL(link).hash, link).toBe('');
      const linkedResponse = await page.request.get(link);
      if (linkedResponse.status() >= 400) failures.push(`${linkedResponse.status()} ${link}`);
    }
  }

  expect(failures).toEqual([]);
});

test('runtime: each route keeps one active item per nav and preserves child icons across languages', async ({ page }) => {
  await resetLanguage(page);
  let observedChildIcons = 0;

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    await expect(page.locator('.navbar__link[aria-current]'), route).toHaveCount(1);
    await expect(page.locator('.mobile-menu__link[aria-current]'), route).toHaveCount(1);

    const chineseIconCount = await page.locator(childIconSelector).count();
    observedChildIcons += chineseIconCount;
    await page.locator('.lang-toggle').first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator(childIconSelector), route).toHaveCount(chineseIconCount);
  }

  expect(observedChildIcons).toBeGreaterThan(0);
});

test('runtime: all five pages emit zero console errors', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${page.url()}: ${message.text()}`);
  });

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
  }

  expect(consoleErrors).toEqual([]);
});
