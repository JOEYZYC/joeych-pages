const { expect, test } = require('@playwright/test');
const { capture, resetLanguage } = require('./helpers');

const home = '.home-editorial';
const profile = '.home-editorial__profile';
const cta = '.home-editorial__cta';
const summary = {
  zh: '苏州工学院电子信息工程专业本科生，综测专业排名 5/71。研究兴趣涵盖嵌入式系统、无线感知与深度学习、超表面/太赫兹器件与天线设计。已发表学术论文 6 篇，申请发明专利 4 项，斩获国家级与省级学科竞赛奖项十余项。热爱动手实践，擅长从电路设计、嵌入式开发到算法部署的软硬件全栈工程。',
  en: 'Undergraduate in Electronic & Information Engineering at Suzhou Institute of Technology, ranked 5/71. Research interests span embedded systems, wireless perception with deep learning, and metasurface / terahertz devices and antenna design. Author of 6 publications, 4 patent applications, and 10+ national or provincial competition awards. A hands-on hardware-software engineer, from circuit design and embedded development to algorithm deployment.',
};

async function openHomepage(page) {
  await page.goto('index.html', { waitUntil: 'networkidle' });
  await expect(page.locator(home)).toBeVisible();
}

async function expectPageOwnedOverflow(page) {
  const scrollState = await page.locator(home).evaluate((element) => {
    const panes = [
      element,
      element.querySelector('.home-editorial__portrait'),
      element.querySelector('.home-editorial__identity'),
      element.querySelector('.home-editorial__greeting'),
      element.querySelector('.home-editorial__profile'),
    ];
    return panes.map((pane) => ({
      clientHeight: pane.clientHeight,
      scrollHeight: pane.scrollHeight,
      overflowY: getComputedStyle(pane).overflowY,
    }));
  });

  for (const pane of scrollState) {
    expect(pane.scrollHeight).toBeLessThanOrEqual(pane.clientHeight + 1);
    expect(['auto', 'scroll']).not.toContain(pane.overflowY);
  }
}

async function expectNoOverlaps(page) {
  const hasOverlap = await page.locator(home).evaluate((element) => {
    const rects = [...element.children]
      .flatMap((child) => child.classList.contains('home-editorial__identity') ? [...child.children] : [child])
      .map((child) => child.getBoundingClientRect());
    return rects.some((first, index) => rects.slice(index + 1).some((second) => {
      const overlaps = first.left < second.right && second.left < first.right
        && first.top < second.bottom && second.top < first.bottom;
      return overlaps && first.width > 0 && first.height > 0 && second.width > 0 && second.height > 0;
    }));
  });
  expect(hasOverlap).toBeFalsy();
}

test.beforeEach(async ({ page }) => {
  await resetLanguage(page);
});

test('homepage: renders the exact bilingual split identity content', async ({ page }) => {
  await openHomepage(page);

  const main = page.locator('main.home-editorial');
  await expect(main.locator(':scope > .home-editorial__portrait > .home-editorial__portrait-image')).toHaveCount(1);
  await expect(main.locator(':scope > .home-editorial__identity > .home-editorial__greeting')).toHaveCount(1);
  await expect(main.locator(':scope > .home-editorial__identity > a.home-editorial__profile')).toHaveCount(1);
  await expect(main.locator('.home-editorial__title')).toHaveText('你好，我是张易成');
  await expect(main.locator('.home-editorial__eyebrow')).toHaveText('电子信息工程');
  await expect(main.locator('.home-editorial__tagline')).toHaveText('嵌入式系统 / 无线感知 / 超表面与太赫兹');
  await expect(main.locator('.home-editorial__summary')).toHaveText(summary.zh);
  await expect(main.locator(profile)).toHaveAttribute('href', /experience\.html$/);

  await page.locator('.lang-toggle').click();
  await expect(main.locator('.home-editorial__title')).toHaveText("Hello, I'm JOEYCH");
  await expect(main.locator('.home-editorial__eyebrow')).toHaveText('Electronic & Information Engineering');
  await expect(main.locator('.home-editorial__tagline')).toHaveText('Embedded Systems / Wireless Perception / Metasurfaces & Terahertz');
  await expect(main.locator('.home-editorial__summary')).toHaveText(summary.en);
  await expect(main.locator(`${cta} > span[data-en]`)).toHaveText('Learn more');
  await expect(main.locator('.home-editorial__cta-arrow')).toHaveText('→');
});

test('homepage: excludes retired education, campus, skills, contact, projects, and achievements sections', async ({ page }) => {
  await openHomepage(page);

  const main = page.locator('main.home-editorial');
  await expect(main.locator(':scope > section')).toHaveCount(1);
  await expect(main.locator(':scope > .home-editorial__identity > section')).toHaveCount(1);
  for (const selector of [
    '.home-profile', '.timeline', '.home-timeline',
    '.skills-grid', '.skill-card',
    '.home-contact', '.contact-info',
    '.projects-grid', '.project-card', '.project-index', '.project-record',
    '.awards-grid', '.award-card', '.achievement-ledger', '.research-archive',
  ]) {
    await expect(main.locator(selector)).toHaveCount(0);
  }
});

test('homepage: uses the approved viewport grids without overlaps or inner scrolling', async ({ page }, testInfo) => {
  await openHomepage(page);

  const grids = await page.locator(home).evaluate((element) => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(' ').map(Number.parseFloat),
    rows: getComputedStyle(element.querySelector('.home-editorial__identity')).gridTemplateRows
      .split(' ').map(Number.parseFloat),
    geometry: (() => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        contentLeft: rect.left + Number.parseFloat(style.paddingLeft),
        contentRight: document.documentElement.clientWidth - rect.right + Number.parseFloat(style.paddingRight),
        paddingLeft: Number.parseFloat(style.paddingLeft),
        paddingRight: Number.parseFloat(style.paddingRight),
        width: rect.width,
      };
    })(),
  }));
  const isDesktop = testInfo.project.name === 'desktop-1280';
  const isTablet = testInfo.project.name === 'tablet-768';
  const expectedGutter = isDesktop || isTablet ? 24 : 16;
  expect(Math.abs(grids.geometry.paddingLeft - expectedGutter)).toBeLessThanOrEqual(1);
  expect(Math.abs(grids.geometry.paddingRight - expectedGutter)).toBeLessThanOrEqual(1);
  expect(Math.abs(grids.geometry.contentLeft - grids.geometry.contentRight)).toBeLessThanOrEqual(1);
  if (isDesktop) {
    expect(Math.abs(grids.geometry.width - 1080)).toBeLessThanOrEqual(1);
  }
  if (isDesktop || isTablet) {
    const expectedPortraitRatio = isDesktop ? 0.42 : 0.38;
    expect(grids.columns).toHaveLength(2);
    expect(grids.columns[0] / (grids.columns[0] + grids.columns[1])).toBeCloseTo(expectedPortraitRatio, 2);
    expect(grids.rows[0] / (grids.rows[0] + grids.rows[1])).toBeCloseTo(0.44, 2);
  } else {
    expect(grids.columns).toHaveLength(1);
  }
  await expectPageOwnedOverflow(page);
  await expectNoOverlaps(page);
});

test('homepage: exposes the profile action on hover and keyboard focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Hover and focus capture is desktop-specific.');
  await openHomepage(page);

  await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'index', state: 'rest' });
  await expect(page.locator(cta)).toHaveCSS('opacity', '0.68');
  await page.locator(profile).hover();
  await expect(page.locator(cta)).toHaveCSS('opacity', '1');
  await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'index', state: 'hover' });
  await page.locator(profile).focus();
  await expect(page.locator(profile)).toBeFocused();
  await expect(page.locator(cta)).toHaveCSS('opacity', '1');
  await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'index', state: 'focus' });
});

test('homepage: preserves the CTA at mobile and short viewport sizes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openHomepage(page);

  await expect(page.locator(cta)).toHaveCSS('opacity', '1');
  await expectPageOwnedOverflow(page);
  await expectNoOverlaps(page);
  if (testInfo.project.name === 'mobile-375') {
    await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'index', state: 'mobile-320x568' });
  }
});

test.describe('homepage: motion and touch states', () => {
  test('homepage: communicates focus without motion for reduced-motion users', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await openHomepage(page);
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBeTruthy();
      await page.locator(profile).focus();
      await expect(page.locator(cta)).toHaveCSS('opacity', '1');
      const transitions = await page.locator(profile).evaluate((element) => [
        getComputedStyle(element.querySelector('.home-editorial__cta')),
        getComputedStyle(element, '::after'),
      ].map((style) => ({ duration: style.transitionDuration, property: style.transitionProperty })));
      for (const transition of transitions) {
        const hasZeroDuration = transition.duration.split(',').every((duration) => Number.parseFloat(duration) === 0);
        expect(transition.property === 'none' || hasZeroDuration).toBeTruthy();
      }
    } finally {
      await context.close();
    }
  });
});

test.describe('homepage: coarse-pointer states', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('homepage: keeps the CTA visible without hover on touch devices', async ({ page }) => {
    await openHomepage(page);
    await expect(page.locator(cta)).toHaveCSS('opacity', '1');
    await expectPageOwnedOverflow(page);
  });
});
