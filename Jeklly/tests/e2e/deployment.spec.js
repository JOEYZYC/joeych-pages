const { expect, test } = require('@playwright/test');

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8123/joeych-pages/';
const unpublishedPaths = [
  '素材/',
  'node_modules/',
  'package.json',
  'package-lock.json',
  'playwright.config.js',
  'scripts/',
  'tests/',
  '.omo/',
  '.playwright-mcp/',
  '.codegraph/',
  '.tmp-asset-prep/',
];

test('deployment: does not publish local tooling or source material', async ({ request }) => {
  for (const unpublishedPath of unpublishedPaths) {
    const response = await request.get(new URL(unpublishedPath, baseUrl).href);
    expect(response.status(), unpublishedPath).toBe(404);
  }
});
