const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { expect, test } = require('@playwright/test');
const { capture, resetLanguage } = require('./helpers');

const techStackRoute = process.env.TECH_STACK_ROUTE || 'tech-stack.html';
const projectIds = [
  'power-print-recognition',
  'dual-light-fusion',
  'resgatnet',
];
const learningMapSummaryLabels = {
  zh: ['基础知识 — 点击可折叠', '技术栈 — 点击可折叠', '架构设计 — 点击可折叠'],
  en: ['Fundamentals — click to collapse', 'Technology Stack — click to collapse', 'Architecture Design — click to collapse'],
};
const taxonomyLabels = [
  '基础知识', '操作系统', '数据库', '算法', '网络', '技术栈', 'AI 技术', '云计算',
  '嵌入式', '中间件层', '安全加密', '存储技术', '多媒体处理', '数据库与数据管理', '图形显示', '文件系统',
  '云端与后台', '后端开发', '数据分析与可视化', '云服务', '工具链', '调试与测试', '开发工具', '性能优化', 'CI CD与DevOps',
  '应用层', '嵌入式AI ML', '应用框架', '用户界面开发', 'OTA与远程管理', '操作系统层', '裸机编程', '嵌入式Linux', 'Android系统',
  'FreeRTOS', 'RT-Thread', 'RTOS基础', '横切关注点', '安全与可靠性', '编程语言', '软件架构与设计模式', '项目管理与职业',
  '硬件层', '传感器技术', '电源管理', '通信接口硬件', '芯片架构', '硬件设计基础', '执行器控制', '行业领域', '工业自动化',
  '航空航天与国防', '汽车电子', '消费电子', '医疗设备', '通信与网络', '网络协议', '无线通信', 'IoT云接入', '驱动与BSP层',
  '内存管理', '设备驱动开发', '设备树与BSP', '时钟与定时器', '中断与异常处理', 'Bootloader开发', '架构设计', '分布式系统架构', '平台架构', '嵌入式系统架构',
];

test.beforeEach(async ({ page }) => {
  await resetLanguage(page);
});

test('tech-stack: renders four evidence-backed skill groups before the learning map', async ({ page }, testInfo) => {
  await page.goto(techStackRoute, { waitUntil: 'domcontentloaded' });

  const groups = page.locator('.skill-groups > .skill-group');
  await expect(groups).toHaveCount(4);
  await expect(groups.locator('.skill-group__title')).toHaveText(['硬件', '软件', '算法与仿真', '通用']);
  await expect(groups.locator('.skill-group__tags .tag')).toHaveCount(12);
  await expect(groups.locator('.skill-group__tags a')).toHaveCount(0);
  expect(await page.locator('.skill-groups').evaluate((groups) => Boolean(
    groups.compareDocumentPosition(document.querySelector('.learning-map')) & Node.DOCUMENT_POSITION_FOLLOWING,
  ))).toBe(true);

  const evidenceByGroup = [
    projectIds.slice(0, 2),
    projectIds,
    projectIds,
    [],
  ];
  for (const [index, evidenceIds] of evidenceByGroup.entries()) {
    const links = groups.nth(index).locator('.skill-group__evidence a');
    await expect(links).toHaveCount(evidenceIds.length);
    expect(await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')))).toEqual(
      evidenceIds.map((projectId) => `/joeych-pages/projects.html#${projectId}`),
    );
  }

  await expect(page.locator('.learning-map > .learning-map__section')).toHaveCount(3);
  await expect(page.locator('.learning-map > .learning-map__section > .learning-map__summary')).toHaveText(learningMapSummaryLabels.zh);
  await expect(page.locator('.learning-map > .learning-map__section[open]')).toHaveCount(3);
  await expect(page.locator('.learning-map .learning-map__subsection[open]')).toHaveCount(1);
  const learningMapText = await page.locator('.learning-map').innerText();
  for (const label of taxonomyLabels) {
    expect(learningMapText).toContain(label);
  }
  await capture(page, { projectName: testInfo.project.name, lang: 'zh', page: 'tech-stack', state: 'default' });
});

test('tech-stack: preserves native details keyboard behavior and English labels', async ({ page }, testInfo) => {
  await page.goto(techStackRoute, { waitUntil: 'domcontentloaded' });

  const firstSection = page.locator('.learning-map > .learning-map__section').first();
  const summary = firstSection.locator('.learning-map__summary');
  await summary.focus();
  await page.keyboard.press('Space');
  await expect(firstSection).not.toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(firstSection).toHaveAttribute('open', '');

  await page.locator('.lang-toggle').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.skill-group__title')).toHaveText(['Hardware', 'Software', 'Algorithms & Simulation', 'General']);
  await expect(page.locator('.learning-map > .learning-map__section > .learning-map__summary')).toHaveText(learningMapSummaryLabels.en);
  await expect(page.locator('.learning-map__subsection > .learning-map__summary')).toHaveText('Embedded Systems — click to expand sub-layers');
  await expect(page.locator('body')).not.toContainText(/proficiency|proficient|expert|beginner|熟练|精通|掌握|水平|评级/i);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.locator('body').evaluate((body) => body.clientWidth));
  await capture(page, { projectName: testInfo.project.name, lang: 'en', page: 'tech-stack', state: 'details-keyboard' });
});

test('tech-stack: keeps source markup Liquid-safe and rejects taxonomy or proficiency regressions', async () => {
  const template = readFileSync(join(__dirname, '..', '..', 'tech-stack.html'), 'utf8');

  expect(template).toContain("{% include editorial-page-intro.html eyebrow=\"TECH STACK\" title_zh=\"技术栈\" title_en=\"Tech Stack\" intro_zh=\"这里优先展示已在项目中使用的能力，其余内容作为持续学习的技术地图。\" intro_en=\"Proven project capabilities come first; the remaining topics form an ongoing technical learning map.\" %}");
  expect(template).toContain('{% for skill in site.data.profile.skills %}');
  expect(template.match(/class=\"learning-map__section\" open/g)).toHaveLength(3);
  expect(template).toContain('class="learning-map__subsection" open');
  for (const label of [...learningMapSummaryLabels.zh, ...learningMapSummaryLabels.en]) {
    expect(template).toContain(label);
  }
  expect(template).not.toMatch(/href=\"\/(?!\{)/);
  expect(template).not.toMatch(/proficiency|proficient|expert|beginner|熟练|精通|掌握|水平|评级/i);
  expect(template).toContain("{{ '/projects.html#power-print-recognition' | relative_url | escape }}");
  expect(template).toContain("{{ '/projects.html#dual-light-fusion' | relative_url | escape }}");
  expect(template).toContain("{{ '/projects.html#resgatnet' | relative_url | escape }}");
  for (const label of taxonomyLabels) {
    expect(template).toContain(label);
  }
});
