const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { expect, test } = require('@playwright/test');

const root = join(__dirname, '..', '..'); const awardsPath = join(root, 'awards.html'); const dataDirectory = join(root, '_data');
const mainScriptPath = join(root, 'assets', 'js', 'main.js'); const stylesheetPath = join(root, 'assets', 'css', 'main.css');
const brokenCertificate = {
  src: 'assets/img/certificates/runtime-missing.png',
  zh: '运行时缺失证书',
  en: 'Runtime missing certificate',
};

function unquote(value) {
  return value.trim().replace(/^'(.*)'$/, '$1');
}

function pairedValue(record, key) {
  const matcher = new RegExp(`^\\s*${key}: \\{ zh: (.*), en: (.*) \\}$`, 'm');
  const match = record.match(matcher);
  if (!match) throw new Error(`Missing ${key} bilingual value`);
  return { zh: unquote(match[1]), en: unquote(match[2]) };
}

function certificates(record) {
  return [...record.matchAll(/^\s*- \{ src: '([^']+)', zh: '([^']*)', en: '([^']*)' \}$/gm)]
    .map((match) => ({ src: match[1], zh: match[2], en: match[3] }));
}

function listRecords(file, kind) {
  const source = readFileSync(join(dataDirectory, file), 'utf8');
  return source.split(/^- id: /m).slice(1).map((record) => {
    const id = record.slice(0, record.indexOf('\n'));
    const year = Number(record.match(/^\s*year: (\d+)$/m)?.[1]);
    if (!id || !year) throw new Error(`Invalid ${kind} record`);
    return {
      id,
      kind,
      year,
      title: pairedValue(record, 'title'),
      certificates: certificates(record),
      ...(kind === 'award' ? {
        prizes: [...record.matchAll(/^\s*- \{ level: ([^,]+), zh: (.*), en: (.*) \}$/gm)]
          .map((match) => ({ level: match[1], zh: match[2], en: match[3] })),
      } : {}),
      ...(kind === 'publication' ? { venue: pairedValue(record, 'venue') } : {}),
      ...(kind !== 'award' ? { authors: pairedValue(record, 'authors') } : {}),
    };
  });
}

function thesisRecord() {
  const source = readFileSync(join(dataDirectory, 'thesis.yml'), 'utf8');
  const id = source.match(/^id: (.+)$/m)?.[1];
  const year = Number(source.match(/^year: (\d+)$/m)?.[1]);
  const title = source.match(/^title:\n\s+zh: (.+)\n\s+en: (.+)$/m);
  const award = source.match(/^award:\n\s+zh: (.+)\n\s+en: (.+)$/m);
  if (!id || !year || !title || !award) throw new Error('Invalid thesis record');
  return {
    id,
    kind: 'thesis',
    year,
    title: { zh: title[1], en: title[2] },
    award: { zh: award[1], en: award[2] },
    certificates: [],
  };
}

const records = {
  awards: listRecords('awards.yml', 'award'),
  publications: listRecords('publications.yml', 'publication'),
  patents: listRecords('patents.yml', 'patent'),
  thesis: thesisRecord(),
};
const allRecords = [...records.awards, ...records.publications, ...records.patents, records.thesis]; const singleCertificateRecord = allRecords.find((record) => record.certificates.length === 1); const multipleCertificateRecord = allRecords.find((record) => record.certificates.length > 1);

if (!singleCertificateRecord || !multipleCertificateRecord) {
  throw new Error('Fixture requires current single- and multiple-certificate records');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function recordItem(record, content) {
  const interactive = record.certificates.length > 0;
  const className = record.kind === 'award' ? 'achievement-ledger__row' : 'research-archive__item';
  const interaction = interactive
    ? ` data-certs="${escapeHtml(JSON.stringify(record.certificates))}" role="button" tabindex="0" aria-label="查看对应证书 / View related certificate"`
    : '';
  return `<article data-record-id="${escapeHtml(record.id)}" data-record-kind="${record.kind}" class="${className}${interactive ? ' certificate-trigger' : ''}"${interaction}>${content}</article>`;
}

function titleElement(record) {
  return `<h3 class="${record.kind === 'award' ? 'achievement-ledger__title' : 'research-archive__title'}" data-en="${escapeHtml(record.title.en)}">${escapeHtml(record.title.zh)}</h3>`;
}

function awardItem(award) {
  const badges = award.prizes.map((prize) => `<span data-en="${escapeHtml(prize.en)}">${escapeHtml(prize.zh)}</span>`).join('');
  return recordItem(award, `${titleElement(award)}<div class="achievement-ledger__badges">${badges}</div>`);
}

function archiveItem(record) {
  const metadata = record.kind === 'publication'
    ? `<p class="research-archive__meta"><span data-en="${escapeHtml(record.venue.en)}">${escapeHtml(record.venue.zh)}</span><span aria-hidden="true"> · </span><span>${record.year}</span></p>`
    : `<p class="research-archive__meta">${record.year}</p>`;
  const badge = record.kind === 'thesis' ? record.award : record.authors;
  return recordItem(record, `${titleElement(record)}${metadata}<span class="research-archive__badge" data-en="${escapeHtml(badge.en)}">${escapeHtml(badge.zh)}</span>`);
}

function awardFixture() {
  return `<!doctype html>
    <html lang="zh-CN"><head><script>Object.defineProperty(window, 'localStorage', { value: { language: 'zh', getItem() { return this.language; }, setItem(key, value) { this.language = value; } } });</script></head><body>
      <button class="lang-toggle" aria-label="切换语言 / Switch language">中</button>
      <main id="main">
        <section class="achievement-ledger"><h2 data-en="Competition Awards">竞赛获奖</h2>${records.awards.map(awardItem).join('')}</section>
        <section class="research-archive"><h2 data-en="Publications">发表论文</h2>${records.publications.map(archiveItem).join('')}</section>
        <section class="research-archive"><h2 data-en="Patent Applications">申请专利</h2>${records.patents.map(archiveItem).join('')}</section>
        <section class="research-archive"><h2 data-en="Graduation Thesis">毕业设计</h2>${archiveItem(records.thesis)}</section>
        <button id="malformed" class="certificate-trigger" data-certs="not-json" role="button" aria-label="Malformed certificate data">Malformed certificate data</button>
        <button id="broken-image" class="certificate-trigger" data-certs="${escapeHtml(JSON.stringify([brokenCertificate]))}" role="button" aria-label="Broken certificate image">Broken certificate image</button>
      </main>
      <div class="certificate-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="certificate-caption"><button class="certificate-modal__backdrop" aria-label="关闭 / Close"></button><div class="certificate-modal__panel"><button class="certificate-modal__close" aria-label="关闭 / Close">×</button><button class="certificate-modal__nav certificate-modal__nav--prev" aria-label="上一张 / Previous">‹</button><button class="certificate-modal__nav certificate-modal__nav--next" aria-label="下一张 / Next">›</button><figure class="certificate-modal__figure"><img src="" alt=""><figcaption id="certificate-caption" class="certificate-modal__caption"></figcaption></figure></div></div>
    </body></html>`;
}

function fixtureRecord(page, record) {
  return page.locator(`[data-record-id="${record.id}"]`);
}

test.describe('awards:', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(awardFixture());
    await page.addStyleTag({ path: stylesheetPath });
    await page.addScriptTag({ path: mainScriptPath });
  });

  test('archive contract renders the complete YAML ledger, metadata, and certificate associations', async ({ page }) => {
    const source = readFileSync(awardsPath, 'utf8');
    expect(records.awards).toHaveLength(10);
    expect(records.publications).toHaveLength(6);
    expect(records.patents).toHaveLength(4);
    expect(records.thesis).toBeTruthy();
    expect(source).toContain("{% include editorial-page-intro.html eyebrow='AWARDS' title_zh='获奖证书' title_en='Awards & Honors' intro_zh='竞赛、论文、专利与毕业设计，共同记录了持续积累的研究与工程成果。' intro_en='Competitions, publications, patents, and the graduation thesis document a growing body of research and engineering work.' %}");
    expect(source).toContain('<h2 data-en="Competition Awards">竞赛获奖</h2>');
    expect(source).toContain('<h2 data-en="Publications">发表论文</h2>');
    expect(source).toContain('<h2 data-en="Patent Applications">申请专利</h2>');
    expect(source).toContain('<h2 data-en="Graduation Thesis">毕业设计</h2>');
    expect(source).toContain('<p class="research-archive__meta"><span data-en="{{ publication.venue.en | escape }}">{{ publication.venue.zh }}</span><span aria-hidden="true"> · </span><span>{{ publication.year }}</span></p>');
    expect(source).toContain('<p class="research-archive__meta">{{ patent.year }}</p>');
    expect(source).toContain('<p class="research-archive__meta">{{ site.data.thesis.year }}</p>');
    expect(source).toContain('class="achievement-ledger__row{% if award.certificates.size > 0 %} certificate-trigger{% endif %}"');
    expect(source).toContain('class="research-archive__item{% if publication.certificates.size > 0 %} certificate-trigger{% endif %}"');
    expect(source).toContain('class="research-archive__item{% if patent.certificates.size > 0 %} certificate-trigger{% endif %}"');
    expect(source).toContain('<figure class="certificate-modal__figure"><img src="" alt=""><figcaption id="certificate-caption" class="certificate-modal__caption"></figcaption></figure>');
    await expect(page.locator('[data-record-kind="award"]')).toHaveCount(10);
    await expect(page.locator('[data-record-kind="publication"]')).toHaveCount(6);
    await expect(page.locator('[data-record-kind="patent"]')).toHaveCount(4);
    await expect(page.locator('[data-record-kind="thesis"]')).toHaveCount(1);

    for (const record of allRecords) {
      const item = fixtureRecord(page, record);
      const title = item.locator('h3');
      await expect(title).toHaveText(record.title.zh);
      await expect(title).toHaveAttribute('data-en', record.title.en);
      if (record.kind === 'publication') {
        await expect(item.locator('.research-archive__meta')).toHaveText(`${record.venue.zh} · ${record.year}`);
      } else if (record.kind !== 'award') {
        await expect(item.locator('.research-archive__meta')).toHaveText(String(record.year));
      }
      if (record.kind === 'award') {
        await expect(item.locator('.achievement-ledger__badges span')).toHaveCount(record.prizes.length);
        for (const [index, prize] of record.prizes.entries()) {
          const badge = item.locator('.achievement-ledger__badges span').nth(index);
          await expect(badge).toHaveText(prize.zh);
          await expect(badge).toHaveAttribute('data-en', prize.en);
        }
      } else {
        const badge = record.kind === 'thesis' ? record.award : record.authors;
        await expect(item.locator('.research-archive__badge')).toHaveText(badge.zh);
        await expect(item.locator('.research-archive__badge')).toHaveAttribute('data-en', badge.en);
      }
      if (record.certificates.length > 0) {
        expect(JSON.parse(await item.getAttribute('data-certs'))).toEqual(record.certificates);
        await expect(item).toHaveAttribute('role', 'button');
        await expect(item).toHaveAttribute('tabindex', '0');
      } else {
        await expect(item).not.toHaveAttribute('data-certs');
        await expect(item).not.toHaveAttribute('role');
        await expect(item).not.toHaveAttribute('tabindex');
      }
    }

    for (const record of allRecords) {
      for (const certificate of record.certificates) {
        expect(existsSync(join(root, certificate.src))).toBeTruthy();
      }
    }
  });

  test('single certificate opens by keyboard and rejects malformed data', async ({ page }) => {
    const modal = page.locator('.certificate-modal');
    const single = fixtureRecord(page, singleCertificateRecord);
    await single.focus();
    await page.keyboard.press('Enter');
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(singleCertificateRecord.certificates[0].zh);
    await expect(page.locator('.certificate-modal__nav--prev')).toBeDisabled();
    await expect(page.locator('.certificate-modal__nav--next')).toBeDisabled();
    await expect(page.locator('.certificate-modal__close')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await expect(single).toBeFocused();
    await page.locator('#malformed').click();
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
  });

  test('multiple certificates support arrows, focus trapping, and live language changes', async ({ page }) => {
    const modal = page.locator('.certificate-modal');
    await fixtureRecord(page, multipleCertificateRecord).click();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(multipleCertificateRecord.certificates[0].zh);
    await page.locator('.certificate-modal__nav--next').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('.certificate-modal__backdrop')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('.certificate-modal__nav--next')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(multipleCertificateRecord.certificates[1].zh);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(multipleCertificateRecord.certificates[0].zh);
    await page.locator('.lang-toggle').evaluate((button) => button.click());
    await expect(page.locator('.certificate-modal__caption')).toHaveText(multipleCertificateRecord.certificates[0].en);
    await expect(page.locator('.certificate-modal__figure img')).toHaveAttribute('alt', multipleCertificateRecord.certificates[0].en);
    expect(await page.locator('.certificate-modal__caption').evaluate((caption) => caption.previousElementSibling?.tagName)).toBe('IMG');
  });

  test('modal clears stale slides after malformed data and opens the next valid record at index zero', async ({ page }) => {
    const modal = page.locator('.certificate-modal');
    await fixtureRecord(page, multipleCertificateRecord).click();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(multipleCertificateRecord.certificates[1].zh);
    await page.keyboard.press('Escape');
    await page.locator('#malformed').click();
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
    await fixtureRecord(page, singleCertificateRecord).click();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(singleCertificateRecord.certificates[0].zh);
    await expect(page.locator('.certificate-modal__figure img')).toHaveAttribute('src', singleCertificateRecord.certificates[0].src);
    await expect(page.locator('.certificate-modal__nav--prev')).toBeDisabled();
    await expect(page.locator('.certificate-modal__nav--next')).toBeDisabled();
  });

  test('runtime missing image remains an observable modal record without asserting a declared asset is absent', async ({ page }) => {
    const modal = page.locator('.certificate-modal');
    const image = page.locator('.certificate-modal__figure img');
    await page.locator('#broken-image').click();
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(brokenCertificate.zh);
    await expect(image).toHaveAttribute('src', brokenCertificate.src);
    await expect(image).toHaveAttribute('alt', brokenCertificate.zh);
    await image.evaluate((element) => element.dispatchEvent(new Event('error')));
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.certificate-modal__caption')).toHaveText(brokenCertificate.zh);
  });

  test('compact archive content has no horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(fixtureRecord(page, records.thesis)).toBeVisible();
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= body.clientWidth)).toBeTruthy();
  });
});
