const { mkdirSync, readdirSync, renameSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const defaultCaptureRoot = '.omo/evidence/portfolio-editorial-redesign/final/screenshots';
const defaultManifest = '.omo/evidence/portfolio-editorial-redesign/final/manifest.json';

function captureRoot() {
  return process.env.PW_CAPTURE_ROOT || defaultCaptureRoot;
}

function manifestPath() {
  return process.env.PW_MANIFEST || (process.env.PW_CAPTURE_ROOT
    ? join(dirname(captureRoot()), 'manifest.json')
    : defaultManifest);
}

function screenshotName(projectName, lang, page, state) {
  return `${projectName}--${lang}--${page}--${state}.png`;
}

async function resetLanguage(page) {
  await page.addInitScript(() => localStorage.removeItem('site-lang'));
}

async function capture(page, options) {
  const root = captureRoot();
  const name = screenshotName(options.projectName, options.lang, options.page, options.state);
  const filePath = join(root, name);
  mkdirSync(root, { recursive: true });
  await page.screenshot({ path: filePath, fullPage: options.fullPage ?? true });
  return filePath;
}

function writeManifest() {
  const root = captureRoot();
  const manifest = manifestPath();
  mkdirSync(root, { recursive: true });
  const files = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => entry.name)
    .sort();
  mkdirSync(dirname(manifest), { recursive: true });
  const temporary = `${manifest}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ generatedAt: new Date().toISOString(), root, files }, null, 2)}\n`);
  renameSync(temporary, manifest);
  return files;
}

async function crawlInternalLinks(page) {
  const pageUrl = new URL(page.url());
  const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
  return [...new Set(links.map((href) => {
    const url = new URL(href, pageUrl);
    if (url.origin !== pageUrl.origin) return null;
    url.hash = '';
    return url.href;
  }).filter(Boolean))].sort();
}

module.exports = {
  capture,
  crawlInternalLinks,
  resetLanguage,
  screenshotName,
  writeManifest,
};
