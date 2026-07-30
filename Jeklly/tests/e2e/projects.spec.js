const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { expect, test } = require('@playwright/test');
const { capture, writeManifest } = require('./helpers');

const pageSource = readFileSync('projects.html', 'utf8');
const yamlSource = readFileSync('_data/projects.yml', 'utf8');
const stylesheet = readFileSync('assets/css/main.css', 'utf8');
const yamlProgram = "import json, sys, yaml\ntry:\n data=yaml.safe_load(sys.stdin.buffer.read().decode('utf-8'))\nexcept yaml.YAMLError as error:\n print(json.dumps({'error': str(error)})); sys.exit(1)\nprint(json.dumps(data, ensure_ascii=True))";
const expectedPowerPrint = {
  caption: '图1 C# 上位机',
  claim: '在受限 MCU 资源下，实现多设备非侵入式实时识别。',
  title: '「电纹识别」智能物联用电检测装置',
  titleEn: '"Power-Print Recognition" Smart IoT Electricity-Monitoring Device',
};

function localized(value, path) {
  if (!value || typeof value !== 'object' || typeof value.zh !== 'string' || !value.zh || typeof value.en !== 'string' || !value.en) {
    throw new Error(`Invalid localized value at ${path}`);
  }
  return value;
}

function parseProjects(source) {
  let parsed;
  try {
    parsed = JSON.parse(execFileSync('python', ['-c', yamlProgram], {
      encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      input: Buffer.from(source, 'utf8'), maxBuffer: 1_000_000, timeout: 5_000,
    }));
  } catch (error) {
    throw new Error(`YAML parse failed: ${error.stderr || error.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length !== 3) throw new Error(`Expected exactly 3 projects, found ${Array.isArray(parsed) ? parsed.length : 'non-list'}`);

  const ids = new Set();
  for (const [index, project] of parsed.entries()) {
    const path = `projects[${index}]`;
    if (typeof project.id !== 'string' || !project.id || ids.has(project.id)) throw new Error(`Invalid or duplicate id at ${path}`);
    if (!Number.isInteger(project.year)) throw new Error(`Invalid year at ${path}`);
    ids.add(project.id);
    for (const field of ['title', 'claim', 'category', 'summary']) localized(project[field], `${path}.${field}`);
    if (project.contribution !== null) localized(project.contribution, `${path}.contribution`);
    if (!Array.isArray(project.tags) || !project.tags.length) throw new Error(`Invalid tags at ${path}`);
    if (!Array.isArray(project.figures) || !project.figures.length) throw new Error(`Invalid figures at ${path}`);
    if (!Array.isArray(project.links)) throw new Error(`Invalid links at ${path}`);
    project.tags.forEach((tag, tagIndex) => localized(tag, `${path}.tags[${tagIndex}]`));
    project.figures.forEach((figure, figureIndex) => {
      if (typeof figure.id !== 'string' || !figure.id) throw new Error(`Invalid figure id at ${path}.figures[${figureIndex}]`);
      localized(figure, `${path}.figures[${figureIndex}]`);
    });
    project.links.forEach((link, linkIndex) => {
      if (!link || typeof link.type !== 'string' || (link.url !== null && typeof link.url !== 'string')) throw new Error(`Invalid link at ${path}.links[${linkIndex}]`);
      localized(link.label, `${path}.links[${linkIndex}].label`);
    });
  }
  return parsed;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function localizedElement(tag, className, value) {
  return `<${tag} class="${className}" data-en="${escapeHtml(value.en)}">${escapeHtml(value.zh)}</${tag}>`;
}

function renderFixture(projects) {
  const index = projects.map((project, indexNumber) => `<a class="project-index__item" href="#${project.id}"><span class="project-index__number">${String(indexNumber + 1).padStart(2, '0')}</span>${localizedElement('span', 'project-index__title', project.title)}${localizedElement('span', 'project-index__category', project.category)}<span class="project-index__year">${project.year}</span></a>`).join('');
  const records = projects.map((project, indexNumber) => {
    const contribution = project.contribution ? localizedElement('p', 'project-record__contribution', project.contribution) : '';
    const tags = project.tags.map((tag) => localizedElement('span', 'tag', tag)).join('');
    const figures = project.figures.map((figure) => `<figure><div class="img-placeholder"><span class="img-placeholder__hint" data-en="Image coming soon">图片待补充</span></div>${localizedElement('figcaption', '', figure)}</figure>`).join('');
    const links = project.links.map((link) => link.url
      ? `<a class="btn btn--outline" href="${escapeHtml(link.url)}" data-en="${escapeHtml(link.label.en)}">${escapeHtml(link.label.zh)}</a>`
      : localizedElement('span', 'link-placeholder', link.label)).join('');
    return `<article class="project-record" id="${project.id}"><p class="project-record__meta">${String(indexNumber + 1).padStart(2, '0')} / ${project.year}</p><div class="project-record__body">${localizedElement('h2', 'project-record__title', project.title)}${localizedElement('p', 'project-record__claim', project.claim)}${localizedElement('p', 'project-record__summary', project.summary)}${contribution}<div class="project-record__tags">${tags}</div><div class="project-figures">${figures}</div><div class="project-links">${links}</div></div></article>`;
  }).join('');
  return `<!doctype html><html lang="zh-CN"><head><style>${stylesheet}</style></head><body><main id="main"><header class="editorial-intro"><span class="editorial-intro__eyebrow">PROJECTS</span><h1 class="editorial-intro__title" data-en="Projects">项目介绍</h1><p class="editorial-intro__copy" data-en="Three projects trace my work from signal acquisition and edge vision to wireless perception models.">三个项目记录了我从信号采集、边缘视觉到无线感知模型的工程实践。</p></header><nav class="project-index" aria-label="项目索引 / Project index">${index}</nav>${records}</main></body></html>`;
}

async function switchLanguage(page, language) {
  await page.evaluate((nextLanguage) => document.querySelectorAll('[data-en]').forEach((element) => {
    element.textContent = nextLanguage === 'en' ? element.dataset.en : element.dataset.zh || element.textContent;
  }), language);
}

async function assertProjectText(page, language) {
  for (const [indexNumber, project] of projects.entries()) {
    const expected = (value) => value[language];
    const record = page.locator(`#${project.id}`);
    const index = page.locator(`.project-index__item[href="#${project.id}"]`);
    await expect(index.locator('.project-index__number')).toHaveText(String(indexNumber + 1).padStart(2, '0'));
    await expect(index.locator('.project-index__title')).toHaveText(expected(project.title));
    await expect(index.locator('.project-index__category')).toHaveText(expected(project.category));
    await expect(index.locator('.project-index__year')).toHaveText(String(project.year));
    await expect(record.locator('.project-record__meta')).toHaveText(`${String(indexNumber + 1).padStart(2, '0')} / ${project.year}`);
    await expect(record.locator('.project-record__title')).toHaveText(expected(project.title));
    await expect(record.locator('.project-record__claim')).toHaveText(expected(project.claim));
    await expect(record.locator('.project-record__summary')).toHaveText(expected(project.summary));
    await expect(record.locator('.project-record__contribution')).toHaveCount(project.contribution ? 1 : 0);
    if (project.contribution) await expect(record.locator('.project-record__contribution')).toHaveText(expected(project.contribution));
    await expect(record.locator('.project-record__tags .tag')).toHaveText(project.tags.map(expected));
    await expect(record.locator('.project-figures figcaption')).toHaveText(project.figures.map(expected));
    await expect(record.locator('.link-placeholder')).toHaveText(project.links.filter((link) => !link.url).map((link) => expected(link.label)));
    await expect(record.locator('.project-links a')).toHaveText(project.links.filter((link) => link.url).map((link) => expected(link.label)));
  }
}

async function assertLayout(page, language) {
  const result = await page.evaluate(() => {
    const cjkOrphans = [...document.querySelectorAll('.project-index__title, .project-record__title, .project-record__claim, .project-record__summary, .project-record__contribution, .project-figures figcaption')].filter(Boolean).flatMap((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const rows = new Map();
      let node;
      while ((node = walker.nextNode())) [...node.textContent].forEach((character, index) => {
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        const row = Math.round(range.getBoundingClientRect().top);
        rows.set(row, [...(rows.get(row) || []), character]);
      });
      return [...rows.values()].some((characters) => {
        const visible = characters.filter((character) => !/\s/.test(character));
        return visible.length === 1 && /[\u3400-\u9fff]/.test(visible[0]);
      }) ? [element.textContent] : [];
    });
    return {
      cjkOrphans,
      duplicateIds: [...document.querySelectorAll('[id]')].map((element) => element.id).filter((id, index, ids) => ids.indexOf(id) !== index),
      hiddenCaptions: [...document.querySelectorAll('.project-figures figcaption')].filter((caption) => !caption.checkVisibility()).length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  expect(result.horizontalOverflow, `${language} horizontal overflow`).toBe(false);
  expect(result.duplicateIds, `${language} duplicate IDs`).toEqual([]);
  expect(result.hiddenCaptions, `${language} hidden captions`).toBe(0);
  expect(result.cjkOrphans, `${language} CJK orphan lines`).toEqual([]);
}

const projects = parseProjects(yamlSource);

test('projects: source contract binds each YAML field to its required DOM owner', () => {
  const bindings = [
    '<a class="project-index__item" href="#{{ project.id | escape }}">',
    '<span class="project-index__title" data-en="{{ project.title.en | escape }}">{{ project.title.zh | escape }}</span>',
    '<span class="project-index__category" data-en="{{ project.category.en | escape }}">{{ project.category.zh | escape }}</span>',
    '<span class="project-index__year">{{ project.year | escape }}</span>',
    '<article class="project-record" id="{{ project.id | escape }}">',
    '<p class="project-record__claim" data-en="{{ project.claim.en | escape }}">{{ project.claim.zh | escape }}</p>',
    '<p class="project-record__summary" data-en="{{ project.summary.en | escape }}">{{ project.summary.zh | escape }}</p>',
    '<p class="project-record__contribution" data-en="{{ project.contribution.en | escape }}">{{ project.contribution.zh | escape }}</p>',
    '<span class="tag" data-en="{{ tag.en | escape }}">{{ tag.zh | escape }}</span>',
    '<span class="img-placeholder__hint" data-en="{{ \'Image coming soon\' | escape }}">{{ \'图片待补充\' | escape }}</span>',
    '<figcaption data-en="{{ figure.en | escape }}">{{ figure.zh | escape }}</figcaption>',
    '<a class="btn btn--outline" href="{{ link.url | escape }}" target="_blank" rel="noopener noreferrer" data-en="{{ link.label.en | escape }}">{{ link.label.zh | escape }}</a>',
    '<span class="link-placeholder" data-en="{{ link.label.en | escape }}">{{ link.label.zh | escape }}</span>',
  ];
  expect(pageSource).toContain("{% include editorial-page-intro.html eyebrow='PROJECTS' title_zh='项目介绍' title_en='Projects' intro_zh='三个项目记录了我从信号采集、边缘视觉到无线感知模型的工程实践。' intro_en='Three projects trace my work from signal acquisition and edge vision to wireless perception models.' %}");
  expect(pageSource.match(/\{% for project in site\.data\.projects %\}/g)).toHaveLength(2);
  bindings.forEach((binding) => expect(pageSource).toContain(binding));
  expect(pageSource).toContain("{{ '/assets/css/main.css' | relative_url | escape }}");
  expect(pageSource).not.toMatch(/href="\/(?!\{\{)/);
});

test('projects: PyYAML parser rejects malformed and schema-invalid source data', () => {
  expect(projects[0].title.zh).toBe(expectedPowerPrint.title);
  expect(projects[0].claim.zh).toBe(expectedPowerPrint.claim);
  expect(projects[0].figures[0].zh).toBe(expectedPowerPrint.caption);
  expect(projects[0].title.en).toBe(expectedPowerPrint.titleEn);
  expect(() => parseProjects('[')).toThrow('YAML parse failed');
  expect(() => parseProjects(yamlSource.replace('  category:', '  categories:'))).toThrow('Invalid localized value at projects[0].category');
  expect(() => parseProjects(yamlSource.replace('power-print-recognition', 'dual-light-fusion'))).toThrow('Invalid or duplicate id');
});

test.beforeEach(async ({ page }) => {
  await page.setContent(renderFixture(projects), { waitUntil: 'domcontentloaded' });
});

test.afterAll(() => writeManifest());

test('projects: preserves complete YAML records in Chinese and English', async ({ page }) => {
  await expect(page.locator('.project-index__item')).toHaveCount(3);
  await expect(page.locator('.project-record')).toHaveCount(3);
  await expect(page.locator('.project-figures figure')).toHaveCount(7);
  await expect(page.locator('.img-placeholder')).toHaveCount(7);
  await expect(page.locator('.link-placeholder')).toHaveCount(3);
  await assertProjectText(page, 'zh');
  await expect(page.locator('#power-print-recognition .project-record__title')).toHaveText(expectedPowerPrint.title);
  await expect(page.locator('#power-print-recognition .project-record__claim')).toHaveText(expectedPowerPrint.claim);
  await expect(page.locator('#power-print-recognition .project-figures figcaption').first()).toHaveText(expectedPowerPrint.caption);
  await switchLanguage(page, 'en');
  await assertProjectText(page, 'en');
  await expect(page.locator('#power-print-recognition .project-record__title')).toHaveText(expectedPowerPrint.titleEn);
});

test('projects: every index anchor reaches its stable record in both language states', async ({ page }) => {
  for (const project of projects) {
    await page.locator(`.project-index__item[href="#${project.id}"]`).click();
    await expect.poll(() => new URL(page.url()).hash).toBe(`#${project.id}`);
    await expect(page.locator(`#${project.id}`)).toBeInViewport();
  }
  await assertProjectText(page, 'zh');
  await switchLanguage(page, 'en');
  await assertProjectText(page, 'en');
});

test('projects: captions, IDs, overflow, and CJK wrapping survive both language states', async ({ page }) => {
  await assertLayout(page, 'zh');
  await switchLanguage(page, 'en');
  await assertLayout(page, 'en');
});

test('projects: captures fresh bilingual source-backed evidence', async ({ page }, testInfo) => {
  await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'projects', state: 'records' });
  await switchLanguage(page, 'en');
  await capture(page, { projectName: testInfo.project.name, lang: 'en', page: 'projects', state: 'records' });
});
