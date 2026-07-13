# Editorial Portfolio Implementation Contract

This document is the implementation contract for the approved five-route technical editorial portfolio. HTML, Liquid, CSS, and JavaScript changes must follow these decisions exactly.

## 1. Information Architecture

The public portfolio routes are:

| Route | Navigation label | Purpose |
| --- | --- | --- |
| `/index.html` | 自我介绍 / About | Split identity homepage |
| `/experience.html` | 个人经历 / Experience | Education and campus experience only |
| `/awards.html` | 获奖证书 / Awards | Competition ledger and research archives |
| `/projects.html` | 项目介绍 / Projects | Numbered project index and evidence-led records |
| `/tech-stack.html` | 技术栈 / Tech Stack | Proven skill groups and collapsible learning map |

`/about.html` redirects to `{{ '/index.html' | relative_url }}` without a fragment. The global footer appears after the page content on all five routes and existing site layouts.

The shared navigation order is About, Experience, Awards, Projects, Tech Stack. There is no separate Home navigation item. The right-side contact trigger is not a route. It opens the contact panel.

## 2. Palette And Type

The visual identity uses gunmetal, cyan, and ice silver. Keep the page background white or near-white, use gunmetal for structural dark surfaces and body ink, reserve fluorescent cyan for non-text emphasis on dark surfaces, and use the accessible dark cyan foreground for links, focus indicators, and text on light surfaces.

| Token | Value | Contract use |
| --- | --- | --- |
| `--c-navy` | `#2C313A` | Gunmetal identity panel, headings, footer, body ink |
| `--c-accent` | `#46E5FF` | Cyan detail on dark surfaces only |
| `--c-accent-fg` | `#00788f` | Accessible links, focus, and light-surface controls |
| `--c-blue-600` | `#00677a` | Interactive hover foreground |
| `--c-bg` | `#ffffff` | Main background and greeting panel |
| `--c-bg-alt` | `#f3f6f8` | Alternate editorial field |
| `--c-ink` | `#2C313A` | Primary text |
| `--c-muted` | `#61707d` | Metadata and captions |
| `--c-border` | `#C8D2DC` | Hairline rules and dividers |
| `--c-gold` | `#b8842b` | Top-tier award highlight only |

Use `Inter, system-ui, -apple-system, sans-serif` for Latin text and `'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif` for Chinese text. Use a monospace stack only for technical metadata when it adds scanning value.

Body copy is 16px with 1.7 line height. Editorial titles are compact and hierarchy-led, not hero-scale outside the homepage. Metadata and eyebrows are 12px to 14px with positive letter spacing only. Do not use viewport-scaled font sizes. CJK content must allow normal Chinese line breaking, avoid orphaned one-character labels where practical, and keep English labels and values from colliding or overflowing at 375px.

## 3. Shared Geometry

The header is 64px high at every responsive breakpoint. Standard editorial pages use a centered content container with a 1080px maximum width, 24px desktop inline padding, and 16px mobile inline padding. Use unframed full-width sections with hairline rules and editorial columns. Do not turn sections into floating containers or nest cards.

Test the rendered site at these viewports in Chinese and English: `375x812`, `768x1024`, and `1280x900`.

## 4. Homepage Exact DOM And Geometry

The homepage body is exactly this semantic structure. Required Liquid and data attributes may replace each `...`, but no wrapper may be inserted between the named parent and child elements.

```html
<main class="home-editorial"><section class="home-editorial__portrait"><img class="home-editorial__portrait-image" ...></section><div class="home-editorial__identity"><section class="home-editorial__greeting"><p class="home-editorial__eyebrow" ...>...</p><h1 class="home-editorial__title" ...>...</h1><p class="home-editorial__tagline" ...>...</p></section><a class="home-editorial__profile" href="{{ '/experience.html' | relative_url }}"><div class="home-editorial__profile-content"><p class="home-editorial__summary" ...>...</p><span class="home-editorial__cta"><span data-en="Learn more">了解更多</span><span class="home-editorial__cta-arrow" aria-hidden="true">→</span></span></div></a></div></main>
```

`.home-editorial` owns `min-height:calc(100dvh - 64px)` beneath the 64px header. At `>=1024px`, its preferred minimum height is capped at `48rem` via `min(calc(100dvh - 64px), 48rem)`, and the greeting content is vertically centered. The portrait remains uncropped with `object-fit:contain` and `object-position:center bottom`. The desktop columns, identity rows, and panel padding remain unchanged; tablet and mobile retain their existing viewport-height behavior and `justify-content:end` greeting alignment. At `>=768px`, English profile copy uses `var(--sp-6)` block padding and CTA top margin while retaining `var(--sp-12)` inline padding so its longer text fits without pane overflow; Chinese and mobile retain the base spacing. The global footer follows this viewport body and is never included in it.

`.home-editorial` is a centered border-box container capped at 1080px, with 24px inline gutters at `>=768px` and 16px below; its grid ratios apply within the padded content box.

| Range | `.home-editorial` geometry | `.home-editorial__identity` geometry |
| --- | --- | --- |
| `>=1024px` | Two columns, `42% 58%` | Two rows, `56% 44%` |
| `768px-1023px` | Two columns, `38% 62%` | Two rows, `56% 44%` |
| `<768px` | One column, rows `28fr 42fr 30fr` | `display:contents` with explicit placement |

At `<768px`, the direct visual order is greeting, portrait, profile. Achieve it with `display:contents` for `.home-editorial__identity` and explicit grid placement. The page or body owns vertical overflow. No child pane, portrait, greeting, identity, or profile area has its own scroll container.

The portrait uses `portrait-b1-cutout.png`. The greeting panel is white. Its title is `你好，我是张易成` with `data-en="Hello, I'm JOEYCH"`; the eyebrow is the bilingual role from `profile.role`; the tagline is from `profile.tagline`. The profile is one semantic link to `/experience.html`, uses gunmetal, renders `profile.summary` verbatim, and contains the exact CTA label plus an arrow outside the translated span.

Chinese `.home-editorial__summary` text preserves multi-character compounds on a single rendered line with normal wrapping and `word-break:keep-all`; numeric units use NBSP and slash compounds use WORD JOINER controls to prevent breaks while preserving visible copy. English retains its existing wrapping behavior.

The CTA is subdued at rest. On hover or keyboard focus of `.home-editorial__profile`, a full-area bottom-up shadow gradient overlay clarifies the gunmetal panel action and reveals the CTA. On coarse-pointer devices, the CTA remains visible without hover. The profile must remain keyboard operable. Reduced-motion users receive the same state information without animated transition.

## 5. Shared Editorial Primitives

### Editorial Page Intro

Every non-home portfolio route begins with:

```html
<header class="editorial-intro"><span class="editorial-intro__eyebrow">…</span><h1 class="editorial-intro__title" data-en="…">…</h1><p class="editorial-intro__copy" data-en="…">…</p></header>
```

`.editorial-intro` owns the route introduction. `.editorial-intro__eyebrow` owns its small sectional label. `.editorial-intro__title` owns the sole route h1. `.editorial-intro__copy` owns the source-grounded explanatory copy.

### Projects

`.project-index` owns the compact numbered project index. Each `.project-index__item` is one anchor to an exact project record id. `.project-index__number`, `.project-index__title`, `.project-index__category`, and `.project-index__year` own the scan order.

`.project-record` owns one full evidence-led record. `.project-record__meta` owns number and year. `.project-record__claim` owns the approved technical claim. `.project-record__summary`, `.project-record__contribution`, and `.project-record__tags` own their corresponding source data. `.project-figures` owns the figures, and each `figure` has an always-visible `figcaption`. `.link-placeholder` owns an unavailable link state. No project evidence is hidden behind hover.

### Achievements And Archives

`.achievement-ledger` owns chronological competition groups. `.achievement-ledger__year` owns the year rule and `.achievement-ledger__row` owns one competition entry. `.achievement-ledger__title` owns the bilingual title. `.achievement-ledger__badges` owns prize labels. A record with certificates alone may be interactive and use `data-certs`.

`.research-archive` owns the compact publications, patent applications, and graduation thesis records. `.research-archive__item` owns one archive record, `.research-archive__title` owns its bilingual title, `.research-archive__meta` owns venue and year when approved, and `.research-archive__badge` owns the source-backed author or award label. Use no unsupported publication, patent, or thesis metadata.

### Skills

`.skill-groups` owns the four professional skill groups. Each `.skill-group` owns one group title, source-backed tag list, and only its approved evidence links. These groups appear on `/tech-stack.html`, not on the homepage.

`.learning-map` owns the secondary broad taxonomy. Each top-level `<details class="learning-map__section" open>` owns one existing Fundamentals, Technology Stack, or Architecture branch. `.learning-map__summary` owns the bilingual native summary and `.learning-map__content` owns its existing content. The Embedded branch remains `<details class="learning-map__subsection" open>`. Native details behavior is the only interaction. Do not add proficiency ratings or custom accordion JavaScript.

### Contact Panel

`button.identity-contact-trigger` owns the right-side contact action. It contains the translatable label `联系方式` with `data-en="Contact"`, uses `aria-label="联系方式 / Contact"` with `data-en-aria-label="Contact"`, visually matches `.lang-toggle`, has `aria-expanded`, and has `aria-controls="identity-contact-panel"`.

`div#identity-contact-panel.identity-contact-panel[hidden]` owns the hidden contact panel. Its exact child structure is `h2.identity-contact-panel__title + ul.identity-contact-panel__links`. The title is `联系方式` with `data-en="Contact"`. The link list contains only Email, GitHub, Google Scholar, and ORCID.

On desktop, the panel is positioned below the trigger and stays inside the viewport. On mobile, it is a viewport-safe full-width panel below the 64px navigation with 16px side insets. Clicking or pressing Enter or Space on the trigger opens it, updates `aria-expanded`, and focuses Email. Repeating the trigger action, clicking outside, or pressing Escape closes it and restores focus to the trigger. Opening the mobile menu closes the contact panel. Opening the contact panel closes the mobile menu and releases any menu body lock. Only the mobile menu owns its overlay and body scroll lock. Touch users have the same reachable contact links without hover-only behavior.

## 6. Global Footer Exact DOM

The footer must use this Liquid DOM verbatim:

```html
<footer class="site-footer"><div class="container"><section class="site-footer__contact"><h2 class="site-footer__heading" data-en="Contact">联系方式</h2><a class="site-footer__email" href="mailto:{{ site.data.profile.contact.email | escape }}"><span data-en="Email">邮箱</span><span class="site-footer__email-value">{{ site.data.profile.contact.email }}</span></a></section><nav class="site-footer__links" aria-label="链接 / Links"><a href="{{ site.data.profile.contact.github | escape }}" target="_blank" rel="noopener noreferrer">GitHub</a><a href="{{ site.data.profile.contact.scholar | escape }}" target="_blank" rel="noopener noreferrer">Google Scholar</a><a href="{{ site.data.profile.contact.orcid | escape }}" target="_blank" rel="noopener noreferrer">ORCID</a></nav></div></footer>
```

`.site-footer` owns the persistent global contact surface. `.site-footer__contact` owns the heading and email link. `.site-footer__heading` owns the bilingual heading. `.site-footer__email` owns the mail destination, its first span owns the bilingual label, and `.site-footer__email-value` owns the email value. `.site-footer__links` owns only the three approved external links. Do not output phone, hometown, political status, copyright, or a second contact section here.

## 7. Accessibility And Language States

Use semantic `header`, `nav`, `main`, `section`, `article`, `figure`, `figcaption`, and `footer` landmarks. Maintain one h1 per route and a descending heading structure. Every interactive target has a visible focus indicator using the accessible cyan foreground with a 2px outline and 2px offset.

The language system renders Chinese inline and English in `data-en`. `applyLang()` replaces `textContent`, so do not put icons, arrows, or interactive child markup inside an element whose text content changes. The homepage CTA arrow is therefore outside its translated span. Translate `aria-label`, `alt`, and `title` through dedicated `data-en-*` attributes. Chinese remains readable without JavaScript.

Certificate modal behavior retains focus trapping, Escape close, and focus restoration. Captions remain beneath certificate images. Every interactive certificate trigger is keyboard reachable. Native `<details>` controls retain keyboard behavior.

## 8. Motion And Responsive Rules

Motion only communicates an interaction or state change. Animate only `transform`, `opacity`, or `filter`. Do not use `transition: all`, scroll-jacking, autoplay, decorative motion, or layout-property animation. Respect `prefers-reduced-motion` without hiding information or controls.

At 375px, 768px, and 1280px, all text must fit its owner, the header remains 64px high, the contact panel remains reachable, footer content does not overlap the page, figures keep visible captions, and the homepage has no inner scrollbar. Check Chinese and English after live language switching.

## 9. Must-NOT Constraints

- Do not migrate from Jekyll/Liquid, `_data` YAML, vanilla CSS, or vanilla JavaScript.
- Do not add an unapproved navigation destination, search, filtering, dark-mode toggle, 3D, scroll-jacking, autoplay, hover-only information, nested cards, or decorative animation.
- Do not invent accuracy, latency, power, dataset, team, DOI, volume, status, patent identifier, work, internship, proficiency, future-plan, or unsupported-role claims.
- Do not add, remove, redact, or reassociate images and certificates.
- Do not rewrite `_data` schemas broadly or clean unrelated CSS.
- Do not use root-relative internal links. Use `relative_url` for internal routes.
- Do not place icons or child markup inside a `data-en` element whose `textContent` changes.

## 10. Verification Contract

The implementation is checked at `375x812`, `768x1024`, and `1280x900`, in Chinese and English. Verification confirms the exact homepage DOM and grids, page-owned mobile overflow, keyboard and touch contact-panel behavior, source-backed project and archive presentation, visible captions, and the exact footer hierarchy. Any unapproved navigation claim fails this contract.
