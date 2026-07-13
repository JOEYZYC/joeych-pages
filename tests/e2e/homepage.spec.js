const { expect, test } = require('@playwright/test');
const { capture, resetLanguage } = require('./helpers');

const home = '.home-editorial';
const profile = '.home-editorial__profile';
const cta = '.home-editorial__cta';
const desktopViewports = [
  { width: 1280, height: 900 },
  { width: 2000, height: 1000 },
];
const atomicSummaryPhrases = [
  { label: 'rank 5/71', text: '5\u2060/\u206071' },
  { label: 'metasurface / terahertz', text: '超表面\u2060/\u2060太赫兹' },
  { label: '6 publications', text: '6\u00a0篇' },
  { label: '4 patents', text: '4\u00a0项' },
  { label: '涵盖', text: '涵盖' },
  { label: '已发表', text: '已发表' },
  { label: '实践', text: '实践' },
];
const summary = {
  zh: '苏州工学院电子信息工程专业本科生，综测专业排名 5\u2060/\u206071。研究兴趣涵盖嵌入式系统、无线感知与深度学习、超表面\u2060/\u2060太赫兹器件与天线设计。已发表学术论文 6\u00a0篇，申请发明专利 4\u00a0项，斩获国家级与省级学科竞赛奖项十余项。热爱动手实践，擅长从电路设计、嵌入式开发到算法部署的软硬件全栈工程。',
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

async function expectGreetingAndProfileOverflow(page) {
  const panes = await page.locator(home).evaluate((element) => [
    element.querySelector('.home-editorial__greeting'),
    element.querySelector('.home-editorial__profile'),
  ].map((pane) => ({
    horizontal: pane.scrollWidth - pane.clientWidth,
    vertical: pane.scrollHeight - pane.clientHeight,
  })));

  for (const pane of panes) {
    expect(pane.horizontal).toBeLessThanOrEqual(1);
    expect(pane.vertical).toBeLessThanOrEqual(1);
  }
}

async function expectDesktopHomeGeometry(page, language) {
  const geometry = await page.locator(home).evaluate((element) => {
    const portraitPane = element.querySelector('.home-editorial__portrait');
    const portraitImage = element.querySelector('.home-editorial__portrait-image');
    const greetingPane = element.querySelector('.home-editorial__greeting');
    const eyebrow = element.querySelector('.home-editorial__eyebrow');
    const imageRect = portraitImage.getBoundingClientRect();
    const portraitRect = portraitPane.getBoundingClientRect();
    const greetingRect = greetingPane.getBoundingClientRect();
    const eyebrowRect = eyebrow.getBoundingClientRect();
    const scale = Math.min(imageRect.width / portraitImage.naturalWidth, imageRect.height / portraitImage.naturalHeight);
    const containedHeight = portraitImage.naturalHeight * scale;
    const portraitTopGap = imageRect.height - containedHeight;
    const containedBottom = imageRect.top + portraitTopGap + containedHeight;
    return {
      greetingJustifyContent: getComputedStyle(greetingPane).justifyContent,
      homeHeight: element.getBoundingClientRect().height,
      portraitBottomGap: portraitRect.bottom - containedBottom,
      portraitFit: getComputedStyle(portraitImage).objectFit,
      portraitPosition: getComputedStyle(portraitImage).objectPosition,
      portraitTopGap,
      greetingTopGap: eyebrowRect.top - greetingRect.top,
    };
  });

  expect(geometry.greetingJustifyContent).toBe('center');
  expect(geometry.portraitFit).toBe('contain');
  expect(geometry.portraitPosition).toBe('50% 100%');
  expect(geometry.homeHeight).toBeGreaterThanOrEqual(768);
  if (language === 'zh') {
    expect(geometry.homeHeight).toBeCloseTo(768, 0);
  }
  expect(geometry.portraitTopGap).toBeLessThanOrEqual(120);
  expect(geometry.portraitBottomGap).toBeLessThanOrEqual(1);
  expect(geometry.greetingTopGap).toBeLessThanOrEqual(160);
  await expectGreetingAndProfileOverflow(page);
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
    identityRows: getComputedStyle(element.querySelector('.home-editorial__identity')).gridTemplateRows
      .split(' ').map(Number.parseFloat),
    rows: getComputedStyle(element).gridTemplateRows
      .split(' ').map(Number.parseFloat),
    greetingJustifyContent: getComputedStyle(element.querySelector('.home-editorial__greeting')).justifyContent,
    homeMinHeight: Number.parseFloat(getComputedStyle(element).minHeight),
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
    expect(grids.identityRows[0] / (grids.identityRows[0] + grids.identityRows[1])).toBeCloseTo(0.56, 2);
  } else {
    expect(grids.columns).toHaveLength(1);
    const totalRowHeight = grids.rows.reduce((sum, rowHeight) => sum + rowHeight, 0);
    expect(grids.rows[0] / totalRowHeight).toBeCloseTo(0.28, 2);
    expect(grids.rows[1] / totalRowHeight).toBeCloseTo(0.42, 2);
    expect(grids.rows[2] / totalRowHeight).toBeCloseTo(0.30, 2);
  }
  if (!isDesktop) {
    expect(grids.homeMinHeight).toBeCloseTo(page.viewportSize().height - 64, 0);
    expect(grids.greetingJustifyContent).toBe('end');
  }
  await expect(page.locator('.home-editorial__summary')).toHaveText(summary.zh);
  expect(await page.locator('.home-editorial__summary').evaluate((element, phrases) => {
    const textNode = element.firstChild;
    const text = textNode.textContent;
    return phrases.map(({ label, text: phrase }) => {
      const start = text.indexOf(phrase);
      const range = document.createRange();
      range.setStart(textNode, start);
      range.setEnd(textNode, start + phrase.length);
      return { label, lineCount: range.getClientRects().length };
    });
  }, atomicSummaryPhrases)).toEqual(atomicSummaryPhrases.map(({ label }) => ({ label, lineCount: 1 })));
  await expectPageOwnedOverflow(page);
  await expectNoOverlaps(page);
});

test('homepage: caps desktop height and removes excessive portrait and greeting whitespace', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Desktop geometry is covered at explicit desktop viewports.');

  for (const viewport of desktopViewports) {
    for (const language of ['zh', 'en']) {
      await page.setViewportSize(viewport);
      await resetLanguage(page);
      await openHomepage(page);
      if (language === 'en') {
        await page.locator('.lang-toggle').click();
      }
      await expectDesktopHomeGeometry(page, language);
    }
  }
});

test('homepage: fits English greeting and profile panes from tablet through desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'English fit is covered at explicit tablet and desktop viewports.');

  for (const viewport of [{ width: 768, height: 1024 }, ...desktopViewports]) {
    await page.setViewportSize(viewport);
    await resetLanguage(page);
    await openHomepage(page);
    await page.locator('.lang-toggle').click();
    await expect(page.locator(profile)).toHaveCSS('padding-top', '24px');
    await expect(page.locator(profile)).toHaveCSS('padding-left', '48px');
    await expect(page.locator(cta)).toHaveCSS('margin-top', '20px');
    await expectGreetingAndProfileOverflow(page);
  }
});

test('homepage: exposes the profile action on hover and keyboard focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Hover and focus capture is desktop-specific.');
  await openHomepage(page);

  await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'index', state: 'rest' });
  await expect(page.locator(cta)).toHaveCSS('opacity', '0.68');
  expect(await page.locator(profile).evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return {
      backgroundImage: style.backgroundImage,
      bottom: style.bottom,
      left: style.left,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      right: style.right,
      top: style.top,
    };
  })).toEqual({
    backgroundImage: expect.stringContaining('linear-gradient'),
    bottom: '0px',
    left: '0px',
    opacity: '0',
    pointerEvents: 'none',
    right: '0px',
    top: '0px',
  });
  await page.locator(profile).hover();
  await expect(page.locator(cta)).toHaveCSS('opacity', '1');
  await expect.poll(() => page.locator(profile).evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('1');
  await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'index', state: 'hover' });
  await page.mouse.move(0, 0);
  await expect.poll(() => page.locator(profile).evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('0');
  await page.locator(profile).focus();
  await expect(page.locator(profile)).toBeFocused();
  await expect(page.locator(cta)).toHaveCSS('opacity', '1');
  await expect.poll(() => page.locator(profile).evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('1');
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
