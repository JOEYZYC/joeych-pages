# Astro Academic Engineering Portfolio Design System

This is the implementation contract for the approved static Astro portfolio. Future components, routes, CSS, and vanilla TypeScript must follow it without introducing a second visual language. It is an extraction and modernization of the approved Jekyll editorial identity, not a copy of any Demo theme.

## 0. Research Log

- Existing-design extraction: `../Jeklly/DESIGN.md` supplies the approved five-route gunmetal/cyan/ice-silver editorial identity, mobile geometry, evidence-first records, and interaction/accessibility baseline.
- Public-content audit: `../Profile/README.md`, `../Profile/AGENTS.md`, and `../Profile/data/*.yml` establish `Profile/data/` and `Profile/media/` as the sole public content and media source. Astro owns presentation only; it must not create transformed or duplicate authored content.
- Local reference audit: `Demo/README.md` and audited local snapshots were used as mechanism references only. Refined-X contributes external-content discipline and editorial framing; as-folio contributes academic information organization; astropages-bilingual contributes static Chinese-root and English-prefix locale routing; astro-starter-portfolio contributes minimal static primitives and centralized SEO; mirsazzathossain-me contributes selective publication-record density.
- Adopt / adapt / reject: adopt static, data-led Astro primitives, bilingual route pairing, and source-backed evidence; adapt the Jekyll technical-editorial identity into explicit light/dark semantic themes and a responsive visual Bento system; reject copied Demo source or copy, search, CMS, React islands, SSR, analytics, AI/Ask/MCP surfaces, deployment configuration outside the root GitHub Pages exception, generic dashboard decoration, and unsupported academic metadata.
- Lazyweb: skipped. This is an extraction/redesign from an approved existing design and audited local references, not visual greenfield work.
- Imagegen: skipped. The approved identity, public media, and evidence hierarchy already define the visual contract; generated artwork would weaken source-backed presentation.
- Online standards check: [MDN Grid accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Accessibility), [W3C Meaningful Sequence](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html), and [web.dev responsive design basics](https://web.dev/articles/responsive-web-design-basics) reinforce source-ordered DOM, content-led breakpoints, ordinary row-major grids, and reflow over dense visual packing.

## 1. Atmosphere & Identity

The portfolio is a modern academic-engineering dossier: calm blue-gray canvases, clear typographic hierarchy, rounded evidence panels, and cyan-blue accents used for orientation and action. Visual Bento composition makes identity, experience, projects, and evidence easier to scan without turning source records into decoration. Home and project discovery use the strongest spatial composition; long evidence records remain text-first.

The signature interaction is a **2px horizontal signal rail** in the site header. Project state is communicated independently through a logical-start accent inset plus visible localized status text, never through color or motion alone.

### Content and implementation boundary

- Target architecture is a static Astro 6 site with minimal vanilla CSS and vanilla TypeScript. Do not add React, client islands, SSR, a CMS, analytics, search, AI/Ask/MCP features, or deployment automation outside the root GitHub Pages exception.
- `Profile/` is external to the site implementation and is the sole public content source. Read its YAML and referenced public media at build time; retain record IDs, ordering, localized values, nullability, source associations, and literal certificate paths.
- Never read, enumerate, transform, copy, or publish `Profile/private/`. Do not make Astro-owned data aliases, content collections that duplicate Profile facts, or fixture content that can diverge from Profile.
- `Astro/Demo/` is an audited local mechanism reference only. Do not import its source, assets, packages, visual theme, copy, theme implementation, logos, deployments, or optional integrations.
- The site has exactly two explicit semantic themes: `<html data-theme="light">` and `<html data-theme="dark">`. The smallest initializer runs immediately after the viewport meta and before visible paint. It changes `<html data-js="false">` to `data-js="true"`, accepts only `light` or `dark` from `localStorage["joeych-theme"]`, otherwise follows `matchMedia("(prefers-color-scheme: dark)")`, and writes both `data-theme` and `style.colorScheme`.
- A valid stored choice wins over the system. Storage access is always guarded. If a theme write is denied, the current document keeps an in-memory override so later system changes cannot undo the user's choice; a reload safely returns to stored or system state. System changes are followed only when neither valid storage nor an in-memory override exists.
- With JavaScript unavailable, `data-js="false"` remains on the root and CSS `prefers-color-scheme` rules provide the complete system-selected light or dark semantic mapping. Navigation, locale counterpart, contact, and first-certificate destinations remain ordinary reachable anchors.

### Reference provenance

| Reference | Adopt | Adapt | Reject |
| --- | --- | --- | --- |
| `Jeklly/DESIGN.md` | Five-route hierarchy, evidence-first records, contact and certificate behavior | Recompose presentation with base-aware Astro routes, visual Bento panels, and explicit themes | Archive-only DOM, Jekyll/Liquid implementation, scroll reveal |
| Refined-X | External content-root discipline, compact editorial framing, metadata-first reading surface | Static local Profile reads and `SeoHead` | Ask, agent, API, MCP, OpenAPI, and deployment paths |
| as-folio | Academic grouping for projects, publications, and chronology | Render only Profile-supported records in source order | Search, live metrics, BibTeX pipeline, comments, analytics, and deployment config |
| astropages-bilingual | Static Chinese root and `/en/` mirror | Exactly five route concepts and ten documents with locale-pair lookup | First-visit redirect, Pagefind, CMS, blog/gallery, and hosting assumptions |
| astro-starter-portfolio | Small shared primitives and centralized metadata | Tokenized CSS, concise SEO, and native cross-document transitions | Client router, generic work-card data, and non-contract theme code |
| mirsazzathossain-me | Selective publication density | Text-first `ResearchArchive` records from Profile YAML | React islands, Tailwind, citation counts, comments, and dense chrome |

## 2. Color

### Semantic palette

All visible colors are semantic CSS custom properties defined once in `tokens.css`. Raw colors may appear only in the light/dark token declarations and the single `--gradient-hero`; components, SVG consumers, and route CSS use semantic tokens only.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `--color-canvas` | `#f4f7fb` | `#0d1520` | Page canvas |
| `--color-surface` | `#fdfefe` | `#142131` | Primary panel/dialog surface |
| `--color-surface-muted` | `#eaf0f6` | `#1b2b3d` | Secondary field and media well |
| `--color-surface-strong` | `#172c42` | `#09131e` | Footer and strong inverted surface |
| `--color-text` | `#182434` | `#f2f6fa` | Primary text |
| `--color-text-muted` | `#52677d` | `#c0cedd` | Supporting text |
| `--color-text-subtle` | `#5c6e82` | `#a6b7c9` | Metadata and unavailable context |
| `--color-border` | `#d1dce8` | `#34475c` | Quiet panel separation |
| `--color-border-strong` | `#8194a8` | `#5b7591` | Control boundaries requiring 3:1 contrast |
| `--color-accent` | `#086b8b` | `#63d8f5` | Links, states, and restrained signals |
| `--color-accent-hover` | `#05556f` | `#a2eafa` | Hover/pressed foreground |
| `--color-control-hover` | `#004861` | `#a2eafa` | Hover foreground on standard and muted controls |
| `--color-accent-soft` | `#d8f3fb` | `#103c4d` | Selected-state field |
| `--color-accent-on` | `#f9fcff` | `#08202c` | Text on accent |
| `--color-on-strong` | `#f8fbff` | `#f3f8fc` | Text on strong surfaces |
| `--color-on-strong-hover` | `#e1f7ff` | `#d5f7ff` | Hover foreground on strong surfaces |
| `--color-focus` | `#005f82` | `#78dff8` | Focus outline |
| `--color-success` | `#166447` | `#7de0b5` | Success state |
| `--color-warning` | `#7a4b00` | `#ffcc70` | Unavailable/source-pending state |
| `--color-error` | `#a32d2d` | `#ff9f9f` | Error state |
| `--color-backdrop` | `rgb(13 29 45 / .48)` | `rgb(2 9 18 / .68)` | Modal backdrop |

Light shadows are `--shadow-panel: 0 1px 2px rgb(20 36 52 / .06), 0 12px 32px rgb(20 36 52 / .08)` and `--shadow-dialog: 0 24px 64px rgb(20 36 52 / .28)`. Dark shadows keep the same geometry with black alpha `.20/.22` and `.52` respectively.

`--gradient-hero` is `linear-gradient(135deg, #eef9fc 0%, #f7f8fc 54%, #d8f1f7 100%)` in light and `linear-gradient(135deg, #142e43 0%, #103f52 54%, #1d6072 100%)` in dark. It is used only on the Home identity panel.

### Color rules

- Use `--color-border-strong` or the focus outline for control boundaries that require 3:1 contrast; quiet `--color-border` is not a control boundary.
- Do not use gradient text or buttons, glass blur, colored shadows, neon framing, purple hues, or a gradient on any route other than the Home identity panel.
- Theme changes affect tokens only. They never hide evidence, alter source order, change routes, or create theme-specific content.

## 3. Typography

### Families, provenance, and transfer budgets

- Display and editorial headings: `--font-display: "Source Han Serif SC", "Source Serif 4", "Songti SC", Georgia, serif`. Installed local Source Han Serif assets remain within the existing 42 MiB emitted budget.
- Body and UI: `--font-body: system-ui, "PingFang SC", "Microsoft YaHei", sans-serif` with no runtime external dependency.
- Technical metadata: `--font-mono: var(--font-google-sans-code), "SFMono-Regular", Consolas, monospace`, using only the local Google Sans Code normal variable face and limited to dates, route labels, IDs, counts, and source-link types. Its emitted WOFF2 face is at most 256 KiB.

All font assets are local, version-pinned, licensed, base-aware, and available before visual QA captures. The uncached first-load transfer budget is 6 MiB. Never request an external font host.

### Scale

| Level | Token | Size | Line height | Usage |
| --- | --- | --- | --- | --- |
| Display | `--type-display` | `clamp(3rem, 7vw, 5.25rem)` | `1.02` | Home identity only |
| H1 | `--type-h1` | `clamp(2.375rem, 5vw, 4rem)` | `1.08` | Route title |
| H2 | `--type-h2` | `clamp(1.75rem, 2.75vw, 2.5rem)` | `1.16` | Major section title |
| H3 | `--type-h3` | `clamp(1.25rem, 1.5vw, 1.5rem)` | `1.28` | Panel/record title |
| Lead | `--type-lead` | `1.125rem` | `1.65` | Editorial introduction |
| Body | `--type-body` | `1rem` | `1.7` | Default prose |
| Small | `--type-small` | `.875rem` | `1.55` | Summaries and dialog details |
| Meta | `--type-meta` | `.75rem` | `1.35` | Dates, categories, state labels |
| Overline | `--type-overline` | `.6875rem` | `1.35` | Eyebrow with `.1em` tracking |

### Typography rules

- Keep prose between 45ch and 68ch. Long source-backed text wraps naturally and is never truncated.
- Chinese uses normal line breaking. Preserve meaningful compounds and source punctuation.
- Each page has one H1 and descending headings. Locale changes replace complete localized strings, including metadata, alt text, titles, and accessible names.

## 4. Spacing & Layout

### Spacing, shape, and shell tokens

Retain `--space-1` through `--space-20` at `.25rem`, `.5rem`, `.75rem`, `1rem`, `1.25rem`, `1.5rem`, `2rem`, `2.5rem`, `3rem`, `4rem`, and `5rem`. Use `--radius-control: .5rem`, `--radius-panel: 1rem`, `--radius-hero: 1.5rem`, `--header-height: 4.5rem`, `--content-max: 75rem`, `--prose-max: 45rem`, and `--target-size: 2.75rem`.

### Responsive Bento grid

| Context | Grid contract |
| --- | --- |
| `<768px` | One column; `1rem` page gutter, grid gap, and panel padding |
| `768px–1023px` | Eight columns; `1.25rem` gutter/gap; `1.5rem` panel padding |
| `>=1024px` | Twelve columns; `1.5rem` gap; `2rem` panel padding |

- Inline primary navigation appears at `>=1024px`.
- The document owns vertical scrolling. Only viewport-safe modal bodies may create an internal scroll area.
- Shared route content is centered within `--content-max`. Panels use semantic `section`/`article`/`figure` structure and source order remains DOM order.
- Home is one focused Bento pair: desktop hero `1–7` and portrait `8–12`; tablet hero `1–5` and portrait `6–8`; mobile follows hero then portrait. Detailed experience and project evidence remain on their dedicated routes.
- Projects use a source-ordered card grid: desktop and tablet use two columns, mobile uses one. A compact sticky control filters by category, project name, or explicitly linked honor; selecting one control clears the other filter path. Cards retain the sourced primary image or the explicit Profile placeholder; a native dialog exposes complete project detail and its explicitly linked achievements.
- Experience uses one wide education panel, then four source-ordered campus panels with desktop spans `5,7,7,5`, tablet spans `3,5,5,3`, and full-width mobile panels. Panel padding follows the shared `1rem`/`1.5rem`/`2rem` responsive scale on every edge.
- Awards use two equal source-ordered columns at tablet and desktop widths; an odd final record spans the row instead of leaving a grid hole. Publications and patents use 6 desktop/4 tablet columns, and the singleton thesis is full width.
- Portraits and evidence figures remain uncropped where specified. Never hide source text behind media or hover state.
- At 200% zoom, reflow rather than clip; preserve navigation, captions, controls, status labels, and 44px targets without horizontal page overflow.

### Routes, locale, and compatibility

Chinese is the default locale at the base-aware root. English is a mirror under `/en/`. Internal links are generated with the base-aware route helper configured for `/joeych-pages`; no component hard-codes root-relative internal URLs.

| Canonical Chinese route | English mirror | Purpose |
| --- | --- | --- |
| `/` | `/en/` | Identity, summary, and routes to detailed evidence |
| `/experience/` | `/en/experience/` | Education and campus experience |
| `/awards/` | `/en/awards/` | Awards, publications, patents, and thesis |
| `/projects/` | `/en/projects/` | Sticky project filtering, cards, and complete detail dialogs |
| `/tech-stack/` | `/en/tech-stack/` | Evidence-backed skill groups |

The build remains static Astro, emits exactly these ten documents, and publishes only `Astro/dist` through the unchanged root GitHub Pages workflow.

## 5. Components & Primitives

### Shared component rules

- All labels, records, links, figures, certificates, and media derive from Profile data and media only. Null source values render the localized unavailable state rather than guessed content.
- Every control has default, hover, active, focus-visible, disabled/unavailable where applicable, and touch-reachable behavior. Focus is a 2px `--color-focus` outline with 2px offset.
- Icons use Font Awesome Free 7.3.1 direct named imports only, rendered at Astro build time through SVG Core. Every emitted SVG uses `currentColor`, stable `data-icon`, `focusable="false"`, and `aria-hidden="true"`. Callers own visible localized text or an accessible name plus title. Never import a whole icon pack or add runtime icon code.
- No generic `Card`/`Bento` abstraction is permitted. Route-specific semantic panels keep their meaning and source structure explicit.

### `SiteHeader`, `ThemeToggle`, and `LanguageLink`

- The sticky header is a solid canvas/surface with a bottom border and 2px horizontal signal rail; no backdrop blur.
- Retain wordmark, five base-aware routes, `aria-current="page"`, language counterpart, contact, and theme controls. Inline primary navigation appears at `>=1024px`.
- Compact navigation opens from a labelled icon button, focuses its first route, and closes on Escape, outside pointer, or route activation. Escape restores the toggle. With no JavaScript, the menu button is hidden and route anchors remain expanded in normal flow.
- `ThemeToggle` is hidden until listeners attach. `aria-pressed="true"` means dark; visible and accessible text describe the destination theme.
- `LanguageLink` preserves the route and project hash while intentionally dropping ephemeral project filter/provenance query state.

### `SiteFooter` and dialogs

- The footer is a strong-surface two-column panel containing only Profile email, GitHub, Google Scholar, and ORCID.
- `ContactDialog` server-renders a visible `mailto:` fallback anchor and hides it only after all dialog listeners attach and the enhancement trigger is revealed.
- `CertificateDialog` server-renders a visible base-aware anchor to the first certificate and applies the same attach-then-reveal sequence.
- Native dialogs preserve caller-scoped IDs, title/first-control focus, modal containment, Escape/close/backdrop paths, focus restoration, sourced captions, image loading/error text, and first/last navigation boundaries.

### Project presentation

- `ProjectMedia` is the only primary project visual primitive. Real project images remain contained and use matching sourced figure text in detailed context. Null images use the dedicated Profile placeholder with contained positioning, a localized pending label, and explicit placeholder alt text. Failed real images never switch to the placeholder.
- `ProjectExplorer` progressively enhances static source-order project details into compact sticky category, project-name, and honor filtering, cards, and per-project native dialogs. Category and project name form one filter path; honor is an alternate path. Cards and dialogs appear only after every listener attaches; without JavaScript complete project details remain available.
- `ProjectRecord` is the no-JavaScript full-width evidence fallback with a stable ID, disclosed primary visual, visible state labels, contribution, remaining source-order figures, links, and explicitly related achievements. Dialog detail uses the same sourced content. Primary-image figures are not duplicated in the later figure grid; missing figure sources become text-only evidence rows; incomplete contribution or achievement data visibly uses the localized pending literal; null URLs retain their source label plus unavailable text.

### Evidence presentation

- Home uses the specified identity/portrait Bento composition and two localized action links. Detailed profile statistics, education records, and featured projects remain on their dedicated routes.
- Experience, awards, publications, patents, and thesis render as native semantic Bento articles in source order. Award prize labels are uniform literals; no rank is inferred.
- `SkillGroup` keeps credential, project, working, and exposure evidence visually distinct. Project evidence links use localized project titles and the exact base-aware `?skill=<tag-id>#<project-id>` destination.
- `SeoHead` remains the centralized static metadata primitive. No analytics, tracking, machine endpoints, dynamic remote images, or generated content pipeline is introduced.

## 6. Motion, View Transitions & Interaction

### Motion tokens and native navigation

Retain `--motion-fast: 120ms`, `--motion-standard: 180ms`, `--motion-dialog: 220ms`, `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`, and `--ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1)`.

Use only native cross-document `@view-transition { navigation: auto; }`. Outgoing root content fades and translates `-.25rem` over 180ms; incoming content fades and translates `.25rem` over 220ms. Neither scales. Unsupported browsers use ordinary static navigation; no client router, Astro transition router, persistence directive, polyfill, or JavaScript route transition is permitted.

Only `transform` and `opacity` animate in the new interaction system. Never use `transition: all`, scroll-driven animation, parallax, autoplay, layout-property animation, SVG path animation, or motion-dependent meaning.

### Header rail and project feedback

- The header owns the only shared signal rail. Pointer hover and keyboard focus move it to a route; `aria-current` defines its resting position. Every route remains legible without the rail.
- Project record `:target`, `data-active`, and `data-evidence-origin` are persistent static states using a 4px logical-start accent inset plus visible localized labels. User filtering never writes history.
- Dialog, menu, filter, navigator, and theme states remain understandable without animation.
- Under `prefers-reduced-motion: reduce`, all new transition and animation durations are `0ms`, view-transition animations are `none`, and every control, status, target, and evidence item remains visible.

## 7. Depth & Surface

### Strategy: controlled Bento depth

Depth comes from semantic tonal layers, visible borders, rounded geometry, and restrained neutral shadows. It clarifies grouping and interaction without imitating glass, floating dashboards, or decorative premium effects.

| Surface | Treatment | Use |
| --- | --- | --- |
| Canvas | `--color-canvas` | Page background and header context |
| Panel | `--color-surface`, `1px solid var(--color-border)`, `--radius-panel`, `--shadow-panel` | Home, project, experience, award, and research panels |
| Muted field | `--color-surface-muted` | Media wells, secondary facts, selected context |
| Hero | `--gradient-hero`, `--radius-hero`, controlled panel shadow | Home identity panel only |
| Strong surface | `--color-surface-strong`, `--color-on-strong` | Footer only |
| Dialog | `--color-surface`, `--radius-panel`, `--shadow-dialog` | Contact and certificate dialogs |

No gradient appears outside the Home identity panel. No colored shadow, backdrop blur, image hover zoom, or shadow-dependent state is permitted. Evidence images use stable media wells and visible captions rather than decorative frames.

## 8. Accessibility Constraints, Visual QA & Accepted Debt

### Inclusive personas and cognitive constraints

| Persona | Primary task | Constraints the design must meet |
| --- | --- | --- |
| Academic reviewer on a laptop | Verify research, authorship position, award level, and project evidence quickly | Stable title-first scan order; year/venue/authorship remains visible; no invented scholarly metadata; records do not rely on images. |
| Engineering recruiter using keyboard | Compare projects, follow source links, and contact the owner | Logical landmarks and heading order; visible focus; route/hash navigation; no nested interactive controls; dialog focus restoration. |
| Chinese-first mobile visitor | Read identity and awards, change language, inspect a certificate | Chinese root is complete without JS; reachable locale link and controls; 44px touch targets; concise labels; one-column reflow. |
| English-reading international collaborator | Navigate the corresponding English portfolio and assess terminology | Exact `/en/` route pair, localized metadata and image text, natural English wrapping, no mixed-language control labels. |
| Low-vision visitor at 200% zoom | Read evidence and open/close dialogs | Reflow without horizontal loss, contrast-compliant text/rules/focus, no information encoded only by cyan or gold, stable sticky header behavior. |
| Motion-sensitive or cognitively fatigued visitor | Orient, browse records, and open evidence without distraction | No decorative animation or auto-changing content; reduced-motion instantaneous state changes; predictable route labels; plain-language unavailable states. |

### Non-negotiable constraints

- Meet WCAG 2.2 AA with full keyboard operation, visible focus, semantic landmarks, one H1 per route, meaningful alt text, captions for every displayed project/certificate figure, and no keyboard trap outside native modal dialogs.
- Respect `prefers-reduced-motion`; do not remove controls or context when motion is disabled.
- Use clear source-backed labels such as unavailable/coming soon only when Profile provides a null or pending link. Do not imply failure, acceptance, ownership, rank, status, or metric beyond source data.
- Keep dialog opening, certificate browsing, route selection, language selection, and external links usable by keyboard, screen reader, touch, and at 200% zoom.
- The exact route matrix is the ten canonical paths only: `/`, `/experience/`, `/awards/`, `/projects/`, `/tech-stack/`, `/en/`, `/en/experience/`, `/en/awards/`, `/en/projects/`, and `/en/tech-stack/`, each under base `/joeych-pages` with trailing slashes.
- The exact theme matrix is `data-theme="light"` and `data-theme="dark"`, plus no-JS system light/dark fallback. Stored light-over-dark-system, stored dark-over-light-system, invalid `joeych-theme`, and denied storage are required state cases.
- The exact viewport matrix is `375x812`, `768x1024`, and `1280x900`, plus 200% browser zoom at every route/theme combination. Capture after local fonts are ready; test no horizontal overflow, one H1, 44px targets, readable evidence, and stable base-aware URLs.
- The exact visual/behavior matrix exercises default, fine-pointer hover, keyboard focus, active, `:target`, dialogs, certificate boundaries, locale counterpart, no-JS, native View Transition support and ordinary unsupported fallback, reduced motion, and page-error-free font/icon loading. Run it in both themes where a JS surface exists. Screenshots disable caret and nonessential animation only after testing the live interaction state; do not mask real content or mid-transition defects.

### Accepted debt

No accepted design, accessibility, content, or implementation debt exists initially. Future debt may be accepted only with a concrete location, affected persona, severity, rationale, owner, exit condition, and explicit user acknowledgement for accessibility debt.

| Item | Location | Why accepted | Owner / exit |
| --- | --- | --- | --- |
| None | N/A | N/A | N/A |

### Must-not constraints

- Do not add search, CMS, React, Tailwind, SSR, analytics, AI/Ask/MCP, a ClientRouter/SPA, deployment workflow outside the root GitHub Pages exception, decorative motion, parallax, scroll-triggered animation, autoplay, purple AI gradients, generic dashboard decoration, unsupported claims, or additional public routes.
- Do not use icon fonts, Font Awesome CDN/Kit/Pro/whole-style imports, runtime external fonts, layout-property animation, full-record/image/text scaling, or motion-dependent meaning.
- Do not add publication counts, DOI, citation counts, affiliations, performance metrics, image associations, project contribution, skill level, or certificates that are not explicitly in Profile.
- Do not copy a Demo theme or user-facing copy. Do not add broad hosting, publishing, or deployment instructions to this implementation contract; defer only to the root GitHub Pages exception.
- Do not modify Profile schemas or data to satisfy presentation. Extend this design system before adding a genuinely new reusable visual token, primitive, state, motion mechanism, accessibility constraint, or accepted debt.
