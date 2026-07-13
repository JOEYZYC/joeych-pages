const { createServer } = require('node:http');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { expect, test } = require('@playwright/test');

const root = join(__dirname, '..', '..');
const footerPath = join(root, '_includes', 'site-footer.html');
const headerPath = join(root, '_includes', 'site-header.html');
const profilePath = join(root, '_data', 'profile.yml');
const scriptPath = join(root, 'assets', 'js', 'main.js');
const stylesheetPath = join(root, 'assets', 'css', 'main.css');
const yamlProgram = "import json, sys, yaml\nprofile = yaml.safe_load(sys.stdin.buffer.read().decode('utf-8'))\nprint(json.dumps(profile, ensure_ascii=False))";
const profile = JSON.parse(execFileSync('python', ['-c', yamlProgram], {
  encoding: 'utf8',
  input: readFileSync(profilePath),
  stdio: ['pipe', 'pipe', 'pipe'],
}));
const contact = profile.contact;
const fixtureRoutes = [
  'index.html',
  'experience.html',
  'awards.html',
  'projects.html',
  'tech-stack.html',
  '404.html',
];
const pageSources = [
  'index.html',
  'experience.html',
  'awards.html',
  'projects.html',
  'tech-stack.html',
  '404.html',
];
const lockedFooter = '<footer class="site-footer"><div class="container"><section class="site-footer__contact"><h2 class="site-footer__heading" data-en="Contact">联系方式</h2><a class="site-footer__email" href="mailto:{{ site.data.profile.contact.email | escape }}"><span data-en="Email">邮箱</span><span class="site-footer__email-value">{{ site.data.profile.contact.email }}</span></a></section><nav class="site-footer__links" aria-label="链接 / Links"><a href="{{ site.data.profile.contact.github | escape }}" target="_blank" rel="noopener noreferrer">GitHub</a><a href="{{ site.data.profile.contact.scholar | escape }}" target="_blank" rel="noopener noreferrer">Google Scholar</a><a href="{{ site.data.profile.contact.orcid | escape }}" target="_blank" rel="noopener noreferrer">ORCID</a></nav></div></footer>';
const retiredContactValues = [
  contact.phone,
  ...Object.values(contact.hometown),
  ...Object.values(contact.political),
].filter((value) => typeof value === 'string');

function renderLiquid(source) {
  return source
    .replaceAll("{{ '/index.html' | relative_url | escape }}", '/joeych-pages/index.html')
    .replaceAll("{{ '/experience.html' | relative_url | escape }}", '/joeych-pages/experience.html')
    .replaceAll("{{ '/awards.html' | relative_url | escape }}", '/joeych-pages/awards.html')
    .replaceAll("{{ '/projects.html' | relative_url | escape }}", '/joeych-pages/projects.html')
    .replaceAll("{{ '/tech-stack.html' | relative_url | escape }}", '/joeych-pages/tech-stack.html')
    .replaceAll('{{ site.data.profile.contact.email | escape }}', contact.email)
    .replaceAll('{{ site.data.profile.contact.email }}', contact.email)
    .replaceAll('{{ site.data.profile.contact.github | escape }}', contact.github)
    .replaceAll('{{ site.data.profile.contact.scholar | escape }}', contact.scholar)
    .replaceAll('{{ site.data.profile.contact.orcid | escape }}', contact.orcid);
}

function fixture(route) {
  const stylesheet = readFileSync(stylesheetPath, 'utf8');
  const script = readFileSync(scriptPath, 'utf8');
  const header = renderLiquid(readFileSync(headerPath, 'utf8'));
  const footer = renderLiquid(readFileSync(footerPath, 'utf8'));
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${stylesheet}</style></head><body>${header}<main id="main"><h1>${route}</h1><p>Fixture content for ${route}.</p></main>${footer}<script>${script}</script></body></html>`;
}

async function expectFooter(page, language) {
  const footer = page.locator('footer.site-footer');
  const expectedLinks = [
    `mailto:${contact.email}`,
    contact.github,
    contact.scholar,
    contact.orcid,
  ];

  await expect(footer).toHaveCount(1);
  await expect(footer.locator(':scope > .container')).toHaveCount(1);
  await expect(footer.locator(':scope > .container > .site-footer__contact')).toHaveCount(1);
  await expect(footer.locator(':scope > .container > nav.site-footer__links')).toHaveCount(1);
  await expect(footer.locator('.site-footer__contact > .site-footer__heading')).toHaveCount(1);
  await expect(footer.locator('.site-footer__contact > a.site-footer__email')).toHaveCount(1);
  await expect(footer.locator('.site-footer__email > span')).toHaveCount(2);
  await expect(footer.locator('.site-footer__email > span').first()).toHaveText(language === 'en' ? 'Email' : '邮箱');
  await expect(footer.locator('.site-footer__email-value')).toHaveText(contact.email);
  await expect(footer.locator('.site-footer__links > a')).toHaveText(['GitHub', 'Google Scholar', 'ORCID']);
  await expect(footer.locator('a')).toHaveCount(4);
  expect(await footer.locator('a').evaluateAll((links) => links.map((link) => link.href))).toEqual(expectedLinks);
  expect(await footer.locator('.site-footer__links a').evaluateAll((links) => links.map((link) => ({
    rel: link.getAttribute('rel'),
    target: link.getAttribute('target'),
  })))).toEqual([
    { rel: 'noopener noreferrer', target: '_blank' },
    { rel: 'noopener noreferrer', target: '_blank' },
    { rel: 'noopener noreferrer', target: '_blank' },
  ]);
  expect(await footer.locator('a').evaluateAll((links) => links.map((link) => new URL(link.href).protocol))).toEqual(['mailto:', 'https:', 'https:', 'https:']);
  for (const value of retiredContactValues) await expect(footer).not.toContainText(value);
  await expect(footer.locator('.footer__section, .footer__bottom, .footer__links, .footer__heading')).toHaveCount(0);

  const layout = await page.evaluate(() => {
    const footerElement = document.querySelector('footer.site-footer');
    const main = document.querySelector('main');
    const footerAnchors = [...footerElement.querySelectorAll('a')].map((anchor) => {
      const bounds = anchor.getBoundingClientRect();
      return { bottom: bounds.bottom, left: bounds.left, right: bounds.right, top: bounds.top };
    });
    const overlaps = footerAnchors.some((anchor, index) => footerAnchors.slice(index + 1).some((other) => (
      anchor.left < other.right && anchor.right > other.left && anchor.top < other.bottom && anchor.bottom > other.top
    )));
    return {
      footerAfterMain: footerElement.getBoundingClientRect().top >= main.getBoundingClientRect().bottom - 1,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      overlaps,
    };
  });
  expect(layout.footerAfterMain, `${language} footer follows page content`).toBe(true);
  expect(layout.horizontalOverflow, `${language} footer horizontal overflow`).toBe(false);
  expect(layout.overlaps, `${language} footer link overlap`).toBe(false);
}

test('footer: source is the locked Liquid hierarchy without retired contact fields', () => {
  expect(readFileSync(footerPath, 'utf8').trim()).toBe(lockedFooter);
  expect(readFileSync(footerPath, 'utf8')).not.toMatch(/phone|hometown|political|电话|籍贯|中共党员/i);
});

test('footer: ownership graph attaches the real include to all public pages, 404, and post layouts', () => {
  for (const pageSource of pageSources) {
    expect(readFileSync(join(root, pageSource), 'utf8'), pageSource).toContain('{% include site-footer.html %}');
  }
  const defaultLayout = readFileSync(join(root, '_layouts', 'default.html'), 'utf8');
  const postLayout = readFileSync(join(root, '_layouts', 'post.html'), 'utf8');
  expect(defaultLayout).toContain('{% include site-footer.html %}');
  expect(postLayout).toMatch(/^---\s*layout: default\s*---/m);
});

test.describe('footer: rendered fixture', () => {
  let server;
  let baseUrl;

  test.beforeAll(async () => {
    server = createServer((request, response) => {
      const route = request.url.split('?')[0].replace('/joeych-pages/', '');
      if (fixtureRoutes.includes(route)) {
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

  for (const route of fixtureRoutes) {
    test(`${route} exposes only the approved public contacts in Chinese and English`, async ({ page }) => {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await expectFooter(page, 'zh');
      await page.locator('.lang-toggle').click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expectFooter(page, 'en');
    });
  }
});
