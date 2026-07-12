# Design System — joeych-pages

> Academic portfolio for 张易成 (JOEYCH). Light, professional, trustworthy.
> "Research portfolio" feel — refined, restrained, editorial clarity.

---

## 1. Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--c-navy` | `#2C313A` | Gunmetal anchor — headings, dark surfaces, footer |
| `--c-accent` | `#46E5FF` | Fluorescent cyan anchor — dark-surface decoration only |
| `--c-accent-fg` | `#00788f` | Accessible dark-cyan foreground for text, links, focus, and light-surface controls |
| `--c-blue` | `var(--c-accent-fg)` | Legacy semantic alias for accessible foreground usage |
| `--c-blue-600` | `#00677a` | Dark-cyan interactive hover tone |
| `--c-blue-soft` | `#e6fbff` | Accessible cyan-tinted fills |
| `--c-blue-50` | `#f3f6f8` | Light neutral section background |
| `--c-ink` | `#2C313A` | Gunmetal body text |
| `--c-muted` | `#61707d` | Secondary text, captions, timestamps |
| `--c-bg` | `#ffffff` | Page background |
| `--c-bg-alt` | `#f3f6f8` | Alternate section background |
| `--c-border` | `#C8D2DC` | Ice silver gray anchor — borders and dividers |
| `--c-silver` | `#C8D2DC` | Ice silver gray anchor — secondary text on dark surfaces |
| `--c-gold` | `#b8842b` | Warm accent — ONLY for top-tier award highlights (国家级·特等) |
| `--c-ice` | `#f7fbff` | Very light blue-tinted white for glass fills |
| `--c-frost` | `rgba(255,255,255,0.58)` | Light glass panel fill |
| `--c-frost-strong` | `rgba(255,255,255,0.78)` | Light glass fallback / strong fill |
| `--c-navy-glass` | `rgba(15,44,82,0.28)` | Dark glass panel fill over images |
| `--c-navy-glass-strong` | `rgba(15,44,82,0.48)` | Dark glass fallback |
| `--c-glass-border-light` | `rgba(255,255,255,0.45)` | Glass border on light sections |
| `--c-glass-border-dark` | `rgba(255,255,255,0.14)` | Glass border on dark/image sections |
| `--c-glass-highlight` | `rgba(255,255,255,0.32)` | Inner top highlight on glass |

### Spacing

Base unit: **4px**. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

| Token | Value | Usage |
|-------|-------|-------|
| `--sp-1` | `4px` | Micro gaps |
| `--sp-2` | `8px` | Icon-to-text, tight padding |
| `--sp-3` | `12px` | Tag padding, small gaps |
| `--sp-4` | `16px` | Card padding (mobile), inline gaps |
| `--sp-5` | `20px` | Card inner padding |
| `--sp-6` | `24px` | Container side padding (desktop) |
| `--sp-8` | `32px` | Section sub-gaps |
| `--sp-10` | `40px` | Between component groups |
| `--sp-12` | `48px` | Card padding (desktop) |
| `--sp-16` | `64px` | Large section gaps |
| `--sp-20` | `80px` | Hero top padding |
| `--sp-24` | `96px` | Maximum section separation |

### Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--r-sm` | `6px` | Small elements, inputs |
| `--r-md` | `10px` | Buttons |
| `--r-lg` | `14px` | Cards |
| `--r-pill` | `999px` | Tags, chips, pills |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-rest` | `0 1px 2px rgba(15,44,82,.06)` | Cards at rest |
| `--shadow-hover` | `0 12px 28px -14px rgba(15,44,82,.22)` | Cards on hover |
| `--shadow-nav` | `0 1px 3px rgba(15,44,82,.08)` | Navbar scroll state |
| `--shadow-glass` | `0 10px 30px rgba(15,44,82,.10)` | Glass panels on light bg |
| `--shadow-glass-dark` | `0 16px 48px rgba(3,10,24,.24)` | Glass panels over images |
| `--shadow-modal` | `0 24px 64px rgba(3,10,24,.32)` | Certificate modal |

### Glass

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-blur-sm` | `10px` | Small panels, captions |
| `--glass-blur-md` | `18px` | Cards, nav, modal panels |
| `--glass-blur-lg` | `28px` | Modal backdrop |
| `--glass-sat` | `160%` | Backdrop saturation boost |
| `--glass-radius-sm` | `14px` | Small glass cards/pills |
| `--glass-radius-lg` | `22px` | Large glass panels |

### Z-index

| Token | Value | Usage |
|-------|-------|-------|
| `--z-nav` | `100` | Sticky navbar |
| `--z-mobile-menu` | `90` | Mobile menu panel |
| `--z-overlay` | `80` | Mobile menu backdrop |
| `--z-modal` | `110` | Certificate modal container |
| `--z-modal-backdrop` | `109` | Modal frosted-glass backdrop |

---

## 2. Typography

### Font Stack

```css
--font-latin: 'Inter', system-ui, -apple-system, sans-serif;
--font-cjk: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

Google Fonts: `Inter:wght@400;500;600;700` + `Noto+Sans+SC:wght@400;500;600;700`, `display=swap`.

### Scale (fluid clamp)

| Element | Size | Weight | Line-height |
|---------|------|--------|-------------|
| Hero h1 | `clamp(2.2rem, 5vw, 3.4rem)` | 700 | 1.15 |
| Section title h2 | `clamp(1.5rem, 2.6vw, 2rem)` | 700 | 1.3 |
| Subtitle h3 | `clamp(1.15rem, 1.8vw, 1.35rem)` | 600 | 1.4 |
| Body | `1rem` (16px) | 400 | 1.7 |
| Small / caption | `0.875rem` | 400 | 1.6 |
| Eyebrow label | `0.75rem` | 600 | 1.4 |

### Eyebrow Labels

- Uppercase, `letter-spacing: 0.12em`
- Color: `--c-blue`
- Small font size (0.75rem)
- Followed by a short accent divider (32px wide, 2px tall, `--c-blue`)
- Larger bilingual title below

---

## 3. Layout

### Container

- Max-width: **1080px**
- Side padding: **24px** (desktop), **16px** (mobile ≤768px)
- Centered with `margin: 0 auto`

### Sections

- Vertical padding: `clamp(3.5rem, 7vw, 6rem)`
- Alternate background: `--c-bg-alt` for every other section

### Grid

- Cards: CSS Grid, `auto-fill, minmax(280px, 1fr)`, gap 24px
- Stats row: flex wrap, gap 16px

---

## 4. Components

### Navbar

- Sticky top, `--z-nav: 100`
- Brand: 张易成 / JOEYCH (bilingual)
- Links: 首页 / 自我介绍 / 获奖证书 / 项目介绍 / 博客
- Active state: `--c-blue` color + bottom border
- Language toggle: "中/EN" button
- Mobile: hamburger icon → slide-in panel from right
- Background: `--c-bg` with `--shadow-nav` on scroll

### Merged Homepage

- A split portrait hero keeps the provided cutout as the first-viewport focal element; gunmetal anchors the lower field and cyan is limited to the exploration affordance.
- The homepage contains the full profile sequence in order: hero, `#about` profile summary, education, campus experience, professional skills, contact, and footer.
- Editorial metrics use hairline ice-silver dividers rather than nested cards; timelines are unframed on the merged homepage.

### Stat Pills

- Inline-flex row, wrap on mobile
- Each pill: icon + label + value
- Background: `--c-blue-soft`, text: `--c-navy`
- Border-radius: `--r-pill`

### Section Header

- Eyebrow label (EN uppercase) + accent divider
- Bilingual title (zh default, en via data-en)
- Left-aligned

### Timeline (vertical)

- Left border line (2px, `--c-border`)
- Dot marker (12px circle, `--c-blue` fill) at each entry
- Date range as eyebrow, title + subtitle, bullet list for details
- Responsive: line moves to top on mobile (horizontal timeline alternative)

### Skill Group Card

- Card with `--r-lg`, `--shadow-rest`
- Title + icon, tag chips inside
- Hover: `--shadow-hover`, `translateY(-3px)`

### Tag Chips

- Background: `--c-blue-soft`
- Text: `--c-blue`
- Padding: 4px 12px
- Border-radius: `--r-pill`
- Font: 0.8125rem, weight 500

### Publication Item

- Numbered index (large, `--c-navy`, weight 700)
- Title (weight 600), venue (italic, `--c-muted`)
- Author position badge (e.g., "第一作者" / "1st Author")

### Award Card

- Card layout with level badge
- Level badges:
  - 国家级 (National): `--c-gold` background
  - 省级 (Provincial): `--c-blue` background
  - 区域/校级 (Regional): `--c-muted` background
- Prize tier: 特等/一等/二等/三等奖 — displayed as text

### Image Placeholder

- Dashed border (2px, `--c-border`)
- Aspect ratio reserved (16:9 or 4:3)
- Centered icon + caption "图N 标题"
- Muted line: "图片待补充 / Image coming soon"

### Link Placeholder Button

- Disabled state
- Dashed border
- Text: "链接待补充 / Link coming soon"
- Cursor: not-allowed

### Footer

- Background: `--c-navy`
- Text: white (0.9 opacity)
- External links + copyright
- © 2026 张易成

### Glass Panel

- Use `.glass` on light sections, `.glass--navy` over dark/image sections.
- Background fallback first; enhance with `backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-sat))`.
- Border: 1px solid using `--c-glass-border-light` / `--c-glass-border-dark`.
- Inner highlight: `inset 0 1px 0 var(--c-glass-highlight)`.
- Radius: `--glass-radius-sm` or `--glass-radius-lg`.
- Avoid placing small body text directly over busy images without a tint layer.

### Certificate Modal

- Backdrop: fixed full viewport, `--c-navy-glass`, `backdrop-filter: blur(var(--glass-blur-lg))`.
- Modal panel: centered, max-width ~90vw / max-height ~85vh, `--c-frost` or `--c-navy-glass-strong`, border highlight.
- Image carousel: left/right arrow buttons, keyboard navigation, click image or backdrop closes.
- Focus management: focus trap while open, restore focus on close.

---

## 5. Motion

### Scroll Reveal

- Trigger: IntersectionObserver, threshold 0.1
- Animation: `translateY(16px) → 0`, `opacity: 0 → 1`
- Duration: 0.55s, easing: ease
- Stagger: 80ms between siblings
- Class: `.reveal` → `.reveal.is-visible`

### Card Hover

- `transform: translateY(-3px)`
- Shadow transition: `--shadow-rest` → `--shadow-hover`
- Duration: 0.3s ease

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Rules

- GPU-only: `transform`, `opacity`, `filter`
- NEVER animate: `width`, `height`, `top`, `left`, `margin`, `padding`
- NEVER use: `transition: all`

---

## 6. Accessibility

### Semantic Landmarks

- `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Proper heading hierarchy (h1 → h2 → h3)

### Keyboard Navigation

- All interactive elements focusable
- Visible focus rings: `outline: 2px solid --c-blue; outline-offset: 2px`
- Skip-to-content link (optional but recommended)

### ARIA

- `aria-label` on icon-only buttons
- `aria-current="page"` on active nav link
- `aria-expanded` on mobile menu toggle

### Contrast

- Body text: `--c-ink` on `--c-bg` → 15.4:1 ✓
- Muted text: `--c-muted` on `--c-bg` → 5.8:1 ✓ (AA)
- Links, active navigation, focus rings, and labels use `--c-accent-fg` on light surfaces; fluorescent `--c-accent` is reserved for dark surfaces and non-text decoration.

---

## 7. i18n (Internationalization)

### Pattern

- Default language: **Chinese (zh)** — inline in HTML
- English translations: `data-en` attribute on same element
- JS toggle swaps `textContent` based on `lang` value in `localStorage`
- Key: `site-lang`, values: `zh` (default) | `en`
- `<html lang>` attribute updates on toggle

### Attribute Translation

- For `aria-label`, `alt`, `title`: use `data-en-aria-label`, `data-en-alt`, etc.
- JS updates these attributes when lang=en

### SEO

- Content lives in HTML (not JS dictionary) for crawlability
- Graceful degradation: no-JS users see Chinese only

### Jekyll Data Contract

- `_data/profile.yml`, `_data/projects.yml`, `_data/publications.yml`, `_data/patents.yml`, and `_data/awards.yml` hold localized `{ zh, en }` objects and stable `id`, `year`, `tags`, `featured`, `image`, and `links` fields where applicable.
- Projects and awards pages render from this data. Certificate triggers are opt-in: only a record with an explicit `certificates` list emits a `data-certs` JSON attribute.

---

## 8. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| ≤ 768px | Mobile: single column, stacked nav, reduced padding |
| 769–1024px | Tablet: 2-column grids, condensed spacing |
| ≥ 1025px | Desktop: full layout, max-width container |

### Mobile Adjustments

- Container side padding: 16px
- Section vertical padding: `clamp(2.5rem, 5vw, 4rem)`
- Hero h1: `clamp(1.8rem, 6vw, 2.4rem)`
- Stats row: wrap to 2 columns
- Timeline: vertical line on left (not horizontal)

---

## 9. Placeholders

### Image Placeholder

- Dashed border: `2px dashed --c-border`
- Aspect ratio: `16/9` (or `4/3` for portraits)
- Background: `--c-bg-alt`
- Centered content: icon + caption
- Caption: "图N 标题" (bold) + "图片待补充 / Image coming soon" (muted)

### Link Placeholder Button

- Disabled: `pointer-events: none; opacity: 0.6`
- Border: `2px dashed --c-border`
- Background: transparent
- Text: "链接待补充 / Link coming soon"
- Cursor: `not-allowed`

---

## 10. Anti-Slop Rules

### DO

- Use design tokens for ALL colors, spacing, radius, shadows
- Follow the eyebrow + bilingual title pattern for section headers
- Keep animations subtle and purposeful
- Use inline SVG icons (lucide-style stroke icons)
- Test at 375px, 768px, 1280px

### DO NOT

- Use emoji as icons (SVG only)
- Hardcode hex values in components (use CSS variables)
- Use `transition: all`
- Animate layout properties (width, height, top, left, margin, padding)
- Use generic AI-slop patterns (purple gradients on white, cookie-cutter cards)
- Stub or simplify content — deliver complete, production-ready pages

---

## 11. File Structure

```
/
├── DESIGN.md (this file)
├── index.html (home)
├── about.html (noindex redirect to `index.html#about`)
├── awards.html (Wave B)
├── projects.html (Wave B)
├── blog.html (Wave B)
├── 404.html (error page)
├── assets/
│   ├── css/
│   │   └── main.css (design system + all components)
│   ├── js/
│   │   └── main.js (i18n, mobile nav, scroll reveal)
│   └── img/
│       └── .gitkeep (future images)
└── _config.yml (Jekyll config — minimal)
```

---

## 12. Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge — last 2 versions)
- No IE11 support
- Graceful degradation for older browsers (layout still works, animations may not)

---

**Last updated:** 2026-07-12
**Version:** 1.1
