const { execFileSync } = require('node:child_process');
const { createServer } = require('node:http');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { expect, test } = require('@playwright/test');
const { capture, resetLanguage } = require('./helpers');

const root = join(__dirname, '..', '..');
const profilePath = join(root, '_data', 'profile.yml');
const pagePath = join(root, 'experience.html');
const cssPath = join(root, 'assets', 'css', 'main.css');
const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8123/joeych-pages/';
const experienceIntro = {
  zh: '从课堂学习到校园实践，这些经历构成了我的工程基础与协作方式。',
  en: 'From academic study to campus practice, these experiences shaped my engineering foundation and collaborative approach.',
};

function readProfile(filePath = profilePath) {
  const script = 'import json, sys, yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1], encoding="utf-8")), ensure_ascii=False))';
  return JSON.parse(execFileSync('python', ['-c', script, filePath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function localized(value) {
  return `data-en="${escapeHtml(value.en)}">${escapeHtml(value.zh)}`;
}

function renderRecord(entry, kind, title, subtitle, details) {
  const items = details.map((item) => `<li ${localized(item)}></li>`).join('');
  return `<article class="achievement-ledger__row" data-experience-kind="${kind}"><time class="achievement-ledger__year">${escapeHtml(entry.period)}</time><div><h3 class="achievement-ledger__title" ${localized(title)}></h3><p ${localized(subtitle)}></p><ul class="achievement-ledger__badges">${items}</ul></div></article>`;
}

function renderFixture() {
  const profile = readProfile();
  const education = profile.education.map((entry) => renderRecord(entry, 'education', entry.school, entry.degree, entry.highlights)).join('');
  const campus = profile.campus_experience.map((entry) => renderRecord(entry, 'campus', entry.organization, entry.role, entry.details)).join('');
  const css = readFileSync(cssPath, 'utf8');
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${css}</style></head><body><header class="navbar"><div class="container navbar__inner"><button class="lang-toggle" aria-label="切换语言 / Switch language">中</button></div></header><main id="main"><header class="editorial-intro"><span class="editorial-intro__eyebrow">EXPERIENCE</span><h1 class="editorial-intro__title" data-en="Experience">个人经历</h1><p class="editorial-intro__copy" data-en="${experienceIntro.en}">${experienceIntro.zh}</p></header><section class="achievement-ledger" aria-labelledby="education-title"><h2 id="education-title" class="achievement-ledger__year" data-en="Education">教育背景</h2>${education}</section><section class="achievement-ledger" aria-labelledby="campus-title"><h2 id="campus-title" class="achievement-ledger__year" data-en="Campus experience">校园经历</h2>${campus}</section></main><footer class="footer"></footer><script>document.querySelector('.lang-toggle').addEventListener('click', () => document.querySelectorAll('[data-en]').forEach((node) => { node.textContent = node.dataset.en; }));</script></body></html>`;
}

let fixtureServer;
let fixtureUrl;
let renderedRouteUrl;

async function findRenderedRoute() {
  const routeUrl = new URL('experience.html', configuredBaseUrl).href;
  try {
    const response = await fetch(routeUrl, { signal: AbortSignal.timeout(1_000) });
    return response.ok ? routeUrl : null;
  } catch {
    return null;
  }
}

test.beforeAll(async () => {
  renderedRouteUrl = await findRenderedRoute();
  fixtureServer = createServer((request, response) => {
    if (request.url === '/experience.html') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(renderFixture());
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolve) => fixtureServer.listen(0, '127.0.0.1', resolve));
  fixtureUrl = `http://127.0.0.1:${fixtureServer.address().port}/experience.html`;
});

test.afterAll(async () => new Promise((resolve) => fixtureServer.close(resolve)));

test.beforeEach(async ({ page }) => {
  await resetLanguage(page);
});

test('experience: rejects malformed profile data before rendering', () => {
  const directory = mkdtempSync(join(tmpdir(), 'experience-profile-'));
  const malformedPath = join(directory, 'profile.yml');
  writeFileSync(malformedPath, 'education: [', 'utf8');
  expect(() => readProfile(malformedPath)).toThrow();
  rmSync(directory, { recursive: true, force: true });
});

for (const language of ['zh', 'en']) {
  test(`experience: renders source-backed ${language} ledger without invented work claims`, async ({ page }, testInfo) => {
    const source = readProfile();
    await page.goto(renderedRouteUrl || fixtureUrl, { waitUntil: 'domcontentloaded' });

    const pageSource = readFileSync(pagePath, 'utf8');
    expect(pageSource).toContain('permalink: /experience.html');
    expect(pageSource).toContain('site.data.profile.education');
    expect(pageSource).toContain('site.data.profile.campus_experience');
    expect(pageSource).toContain(experienceIntro.zh);
    expect(pageSource).toContain(experienceIntro.en);
    expect(pageSource).not.toMatch(/internship|实习|工作经历|Work experience/i);

    if (language === 'en') await page.locator('.lang-toggle').click();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.editorial-intro__copy')).toHaveText(experienceIntro[language]);
    await expect(page.locator('[data-experience-kind="education"]')).toHaveCount(source.education.length);
    await expect(page.locator('[data-experience-kind="campus"]')).toHaveCount(source.campus_experience.length);

    for (const entry of source.education) {
      const record = page.locator('[data-experience-kind="education"]').filter({ hasText: entry.period });
      await expect(record).toHaveCount(1);
      await expect(record).toContainText(entry.school[language]);
      await expect(record).toContainText(entry.degree[language]);
      for (const item of entry.highlights) await expect(record).toContainText(item[language]);
    }

    for (const entry of source.campus_experience) {
      const record = page.locator('[data-experience-kind="campus"]').filter({ hasText: entry.period });
      await expect(record).toHaveCount(1);
      await expect(record).toContainText(entry.organization[language]);
      await expect(record).toContainText(entry.role[language]);
      for (const item of entry.details) await expect(record).toContainText(item[language]);
    }

    await expect(page.locator('main')).not.toContainText(/internship|实习|工作经历|work experience/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await capture(page, { projectName: testInfo.project.name, lang: language, page: 'experience', state: 'default' });
  });
}
