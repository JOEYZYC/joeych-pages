const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { expect, test } = require('@playwright/test');

const root = join(__dirname, '..', '..');
const headerPath = join(root, '_includes', 'site-header.html');
const scriptPath = join(root, 'assets', 'js', 'main.js');
const stylesheetPath = join(root, 'assets', 'css', 'main.css');
const routes = [
  ['index.html', '自我介绍', 'About'],
  ['experience.html', '个人经历', 'Experience'],
  ['awards.html', '获奖证书', 'Awards'],
  ['projects.html', '项目介绍', 'Projects'],
  ['tech-stack.html', '技术栈', 'Tech Stack'],
];

const profile = {
  email: 'szjoeych@gmail.com',
  github: 'https://github.com/JOEYZYC',
  scholar: 'https://scholar.google.com/citations?user=R_3hg2gAAAAJ',
  orcid: 'https://orcid.org/0009-0009-0202-8772',
};

function renderHeader() {
  return readFileSync(headerPath, 'utf8')
    .replaceAll("{{ '/index.html' | relative_url | escape }}", '/joeych-pages/index.html')
    .replaceAll("{{ '/experience.html' | relative_url | escape }}", '/joeych-pages/experience.html')
    .replaceAll("{{ '/awards.html' | relative_url | escape }}", '/joeych-pages/awards.html')
    .replaceAll("{{ '/projects.html' | relative_url | escape }}", '/joeych-pages/projects.html')
    .replaceAll("{{ '/tech-stack.html' | relative_url | escape }}", '/joeych-pages/tech-stack.html')
    .replaceAll('{{ site.data.profile.contact.email | escape }}', profile.email)
    .replaceAll('{{ site.data.profile.contact.github | escape }}', profile.github)
    .replaceAll('{{ site.data.profile.contact.scholar | escape }}', profile.scholar)
    .replaceAll('{{ site.data.profile.contact.orcid | escape }}', profile.orcid);
}

function fixture(route) {
  const stylesheet = readFileSync(stylesheetPath, 'utf8');
  const script = readFileSync(scriptPath, 'utf8');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${stylesheet}</style></head><body>${renderHeader()}<main id="main"><h1>${route}</h1><button id="outside">Outside</button></main><div class="certificate-modal" aria-hidden="true"></div><script>${script}</script></body></html>`;
}

let server;
let baseUrl;

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const route = request.url.split('?')[0];
    if (routes.some(([pathname]) => route === `/joeych-pages/${pathname}`)) {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(fixture(route));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/joeych-pages/`;
});

test.afterAll(async () => new Promise((resolve) => server.close(resolve)));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('site-lang'));
});

test('navigation: exact header fixture exposes five routes and an accessible contact panel (Jekyll deferred)', async ({ page }) => {
  await page.goto(`${baseUrl}index.html`);

  await expect(page.locator('.navbar__link')).toHaveText(routes.map(([, zh]) => zh));
  await expect(page.locator('.mobile-menu__link')).toHaveText(routes.map(([, zh]) => zh));
  await expect(page.locator('.identity-contact-trigger')).toHaveAttribute('aria-controls', 'identity-contact-panel');
  await expect(page.locator('#identity-contact-panel')).toBeHidden();
  expect(readFileSync(headerPath, 'utf8')).not.toContain('data-en="Home"');
});

test('navigation: keeps five route labels, destinations, active state, and language switching aligned', async ({ page }) => {
  for (const [route, zh, en] of routes) {
    await page.goto(`${baseUrl}${route}`);
    const desktopLinks = page.locator('.navbar__link');
    const mobileLinks = page.locator('.mobile-menu__link');
    const expectedHrefs = routes.map(([path]) => `/joeych-pages/${path}`);

    await expect(desktopLinks).toHaveText(routes.map(([, label]) => label));
    await expect(mobileLinks).toHaveText(routes.map(([, label]) => label));
    expect(await desktopLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(expectedHrefs);
    expect(await mobileLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(expectedHrefs);
    await expect(desktopLinks.filter({ hasText: zh })).toHaveAttribute('aria-current', 'page');
    await expect(mobileLinks.filter({ hasText: zh })).toHaveAttribute('aria-current', 'page');

    await page.locator('.lang-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(desktopLinks).toHaveText(routes.map(([, , label]) => label));
    await expect(mobileLinks).toHaveText(routes.map(([, , label]) => label));
    await expect(desktopLinks.filter({ hasText: en })).toHaveAttribute('aria-current', 'page');
    await page.locator('.lang-toggle').click();
  }
});

test('navigation: contact panel supports keyboard, repeated trigger, outside, and Escape dismissal', async ({ page }) => {
  await page.goto(`${baseUrl}index.html`);
  const trigger = page.locator('.identity-contact-trigger');
  const panel = page.locator('#identity-contact-panel');
  const email = panel.locator('a').first();

  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(email).toBeFocused();
  await expect(panel.locator('.identity-contact-panel__links a')).toHaveCount(4);
  await expect(panel.locator('.identity-contact-panel__links a')).toHaveText([
    '邮箱: szjoeych@gmail.com', 'GitHub', 'Google Scholar', 'ORCID',
  ]);

  await trigger.click();
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.mouse.click(8, 500);
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('navigation: menu and contact panel keep focus, bounds, and state ownership through rapid interruptions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-375', 'Mobile menu interaction requires the mobile breakpoint.');
  await page.goto(`${baseUrl}index.html`);
  const menu = page.locator('.mobile-menu');
  const menuTrigger = page.locator('.navbar__hamburger');
  const contactTrigger = page.locator('.identity-contact-trigger');
  const panel = page.locator('#identity-contact-panel');
  const firstMobileLink = menu.locator('.mobile-menu__link').first();
  const overlay = page.locator('.mobile-overlay');
  const email = panel.locator('a').first();

  await menuTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveClass(/is-open/);
  await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(firstMobileLink).toBeFocused();
  await expect(overlay).toHaveClass(/is-visible/);
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('hidden');

  await contactTrigger.click();
  await expect(panel).toBeVisible();
  await expect(menu).not.toHaveClass(/is-open/);
  await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(contactTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(email).toBeFocused();
  await expect(overlay).not.toHaveClass(/is-visible/);
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('');
  expect(await panel.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      bottom: bounds.bottom,
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  })).toEqual(expect.objectContaining({
    left: 16,
    right: 359,
    top: 64,
    viewportHeight: 812,
    viewportWidth: 375,
  }));
  expect(await panel.evaluate((element) => element.getBoundingClientRect().bottom <= window.innerHeight - 16)).toBeTruthy();

  await menuTrigger.click();
  await expect(menu).toHaveClass(/is-open/);
  await expect(panel).toBeHidden();
  await expect(contactTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(firstMobileLink).toBeFocused();
  await expect(overlay).toHaveClass(/is-visible/);
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('hidden');

  await contactTrigger.click();
  await expect(panel).toBeVisible();
  await expect(menu).not.toHaveClass(/is-open/);
  await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(contactTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(email).toBeFocused();
  await expect(overlay).not.toHaveClass(/is-visible/);
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('');

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(menu).not.toHaveClass(/is-open/);
  await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(contactTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(contactTrigger).toBeFocused();
  await expect(overlay).not.toHaveClass(/is-visible/);
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('');

  await menuTrigger.click();
  await expect(firstMobileLink).toBeFocused();
  await menuTrigger.click();
  await expect(menu).not.toHaveClass(/is-open/);
  await expect(menuTrigger).toBeFocused();
  await expect(overlay).not.toHaveClass(/is-visible/);
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('');
});

test('navigation: contact links remain reachable through a touch interaction', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}index.html`);
    await page.locator('.identity-contact-trigger').tap();
    await expect(page.locator('#identity-contact-panel')).toBeVisible();
    await expect(page.locator('#identity-contact-panel a').first()).toBeVisible();
  } finally {
    await context.close();
  }
});
