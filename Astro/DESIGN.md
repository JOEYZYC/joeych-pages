# Astro Academic Engineering Portfolio Design System

This is the implementation contract for the approved static Astro portfolio. Future components, routes, CSS, and vanilla TypeScript must follow it without introducing a second visual language. It is an extraction and modernization of the approved Jekyll editorial identity, not a copy of any Demo theme.

## 0. Research Log

- Existing-design extraction: `../Jeklly/DESIGN.md` supplies the approved five-route gunmetal/cyan/ice-silver editorial identity, mobile geometry, evidence-first records, and interaction/accessibility baseline.
- Public-content audit: `../Profile/README.md`, `../Profile/AGENTS.md`, and `../Profile/data/*.yml` establish `Profile/data/` and `Profile/media/` as the sole public content and media source. Astro owns presentation only; it must not create transformed or duplicate authored content.
- Local reference audit: `Demo/README.md` and audited local snapshots were used as mechanism references only. Refined-X contributes external-content discipline and editorial framing; as-folio contributes academic information organization; astropages-bilingual contributes static Chinese-root and English-prefix locale routing; astro-starter-portfolio contributes minimal static primitives and centralized SEO; mirsazzathossain-me contributes selective publication-record density.
- Adopt / adapt / reject: adopt static, data-led, minimal Astro primitives and bilingual route pairing; adapt the Jekyll visual identity and editorial records to a clean Astro component boundary; reject every Demo visual theme, dark mode, search, CMS, React islands, SSR, analytics, AI/Ask/MCP surfaces, deployment configuration outside the root GitHub Pages exception, rounded-card grids, and unsupported academic metadata.
- Lazyweb: skipped. This is an extraction/redesign from an approved existing design and audited local references, not visual greenfield work.
- Imagegen: skipped. The approved identity, public media, and evidence hierarchy already define the visual contract; generated artwork would weaken source-backed presentation.

## 1. Atmosphere & Identity

The portfolio is a precise technical-editorial dossier: bright ice-silver paper, gunmetal structural fields, and cyan as a measured signal for navigation and proof. It should feel like an engineering notebook edited for an academic review, not a startup dashboard or an awards gallery. The signature is the **signal rail**: full-width editorial rows use a quiet shared cyan marker that glides between a hovered or focused record and its active route, joining navigation and evidence browsing without turning data into cards.

### Content and implementation boundary

- Target architecture is a static Astro 6 site with minimal vanilla CSS and vanilla TypeScript. Do not add React, client islands, SSR, a CMS, analytics, search, AI/Ask/MCP features, or deployment automation outside the root GitHub Pages exception.
- `Profile/` is external to the future site implementation and is the sole content source. Read its YAML and referenced public media at build time; retain record IDs, ordering, localized values, nullability, source associations, and literal certificate paths.
- Never read, enumerate, transform, copy, or publish `Profile/private/`. Do not make Astro-owned data aliases, content collections that duplicate Profile facts, or fixture content that can diverge from Profile.
- `Astro/Demo/` is an audited local mechanism reference only. Do not copy its source hierarchy, visual theme, logos, copy, dark-mode behavior, packages, deployments, or optional integrations.
- The site is single-theme light. Gunmetal is an intentional inverted structural material, not a dark-mode alternate.

### Reference provenance

| Reference | Adopt | Adapt | Reject |
| --- | --- | --- | --- |
| `Jeklly/DESIGN.md` | Five-route editorial hierarchy, gunmetal/cyan/ice-silver palette, evidence-led records, contact and certificate behavior | Use base-aware Astro paths and locale-paired routes rather than Liquid `data-en` replacement | Archive-only DOM, Jekyll/Liquid implementation, scroll reveal |
| Refined-X | External content-root discipline, compact editorial framing, metadata-first reading surface | Static local Profile reads and `SeoHead` rather than its content system | Its monochrome theme, dark mode, Ask, agent, API, MCP, OpenAPI, and deployment paths |
| as-folio | Academic grouping for projects, publications, CV-like chronology | Render only Profile-supported records in restrained ledgers | Search, cards, live metrics, BibTeX pipeline, comments, analytics, and deployment config |
| astropages-bilingual | Chinese default root, `/en/` mirror, locale-aware counterpart links | Exactly five portfolio routes with route-pair lookup | First-visit redirect, Pagefind, CMS, blog/gallery and hosting assumptions |
| astro-starter-portfolio | Small shared primitives, static-first surface, centralized metadata | Tokenized CSS and concise `SeoHead` component | Its theme toggle, transitions router, theme system, and generic work-card layout |
| mirsazzathossain-me | Selective publication density and full citation-like scan order | Compact `ResearchArchive` records from Profile YAML | React islands, tailwind theme, research features, citation counts, comments, and dense site chrome |

## 2. Color

### Palette

All visible colors are CSS custom properties defined once in the future global token layer. No component may introduce raw color values. Cyan is never decorative text on white; use the accessible cyan foreground for text, focus, and light-surface controls.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Paper | `--color-paper` | `#FFFFFF` | Primary page canvas, reading surfaces |
| Ice field | `--color-ice` | `#F3F6F8` | Alternate editorial fields, dialog backdrop tint |
| Ice edge | `--color-ice-strong` | `#E6EDF2` | Input/dialog separation and inactive rail well |
| Gunmetal | `--color-gunmetal` | `#2C313A` | Body ink, headings, header/footer structural surfaces |
| Gunmetal raised | `--color-gunmetal-raised` | `#39414C` | Hovered inverted surfaces only |
| Ink muted | `--color-ink-muted` | `#61707D` | Metadata and secondary explanations |
| Ink faint | `--color-ink-faint` | `#61707D` | Disabled or unavailable text only |
| Rule | `--color-rule` | `#C8D2DC` | Hairline dividers and record boundaries |
| Cyan signal | `--color-signal` | `#46E5FF` | Non-text signal marker on gunmetal, active inverted affordances |
| Cyan foreground | `--color-signal-fg` | `#00788F` | Links, focus outline, active light-surface text |
| Cyan hover | `--color-signal-hover` | `#00677A` | Hover/pressed link and control foreground |
| Award gold | `--color-award-gold` | `#8A5A00` | Source-backed top-tier award labels only |
| Status success | `--color-success` | `#216E4E` | Successful form confirmation if a future static form exists |
| Status warning | `--color-warning` | `#8A5A00` | Unavailable/source-pending link label only |
| Status error | `--color-error` | `#A52A2A` | Dialog or form error only |

### Color rules

- Use paper and ice fields for depth; use rules to divide records. Do not use gradients, purple hues, glass effects, colored shadows, neon framing, or broad cyan fills.
- Gunmetal panels are reserved for the homepage profile action, footer, and selected dialog/header structure. Cyan signal is a small visual cue, never a hero background or body-copy color.
- Award gold appears only when a Profile award record expresses a top-tier result. It is not a general premium accent.
- Contrast targets are WCAG 2.2 AA: 4.5:1 for normal text and 3:1 for large text, controls, focus rings, and meaningful boundaries.

## 3. Typography

### Families

- Display and editorial headings: `"Noto Serif SC", "Source Han Serif SC", "Songti SC", Georgia, serif`.
- Body and UI: `"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`.
- Technical metadata: `"IBM Plex Mono", "SFMono-Regular", Consolas, monospace`.

Use the serif only for display hierarchy and selected record titles. Use body sans for all prose and controls. Mono is scanning support for dates, route labels, IDs, counts, and source-link types, never paragraph copy. Font loading must avoid external runtime dependency where practical and must preserve a metrics-compatible CJK fallback.

### Scale

| Level | Token | Size | Weight | Line height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- | --- |
| Display | `--type-display` | `clamp(2.25rem, 5vw, 4rem)` | 600 | 1.08 | `-0.025em` | Homepage identity only |
| H1 | `--type-h1` | `clamp(2rem, 4vw, 3rem)` | 600 | 1.14 | `-0.02em` | Route title |
| H2 | `--type-h2` | `1.75rem` | 600 | 1.22 | `-0.012em` | Major section title |
| H3 | `--type-h3` | `1.25rem` | 600 | 1.35 | `-0.006em` | Record title |
| Lead | `--type-lead` | `1.125rem` | 400 | 1.65 | `0` | Editorial introduction |
| Body | `--type-body` | `1rem` | 400 | 1.7 | `0` | Default prose |
| Small | `--type-small` | `0.875rem` | 400 | 1.6 | `0` | Summaries and dialog details |
| Meta | `--type-meta` | `0.75rem` | 500 | 1.45 | `0.04em` | Dates, categories, record labels |
| Overline | `--type-overline` | `0.6875rem` | 600 | 1.35 | `0.1em` | Editorial eyebrow; uppercase only for Latin text |

### Typography rules

- Keep prose between 45ch and 68ch. Long English titles may wrap naturally; do not truncate source-backed title, claim, venue, author position, or award text.
- Chinese may use normal line breaking. Preserve meaningful compounds, numeric units, and slash compounds where source content contains non-breaking controls; do not fabricate punctuation or rewritten claims.
- Each page has one H1 and follows descending headings. Locale changes replace complete localized strings, including `lang`, metadata labels, `alt`, `title`, and `aria-label` values, rather than mutating mixed-markup text.

## 4. Spacing & Layout

### Spacing, shape, and shell tokens

| Token | Value | Use |
| --- | --- | --- |
| `--space-1` | `0.25rem` | Icon-label join |
| `--space-2` | `0.5rem` | Tight metadata cluster |
| `--space-3` | `0.75rem` | Tag and compact control gap |
| `--space-4` | `1rem` | Mobile gutter and base stack |
| `--space-5` | `1.25rem` | Record interior rhythm |
| `--space-6` | `1.5rem` | Desktop gutter / section cluster |
| `--space-8` | `2rem` | Record-to-record separation |
| `--space-10` | `2.5rem` | Intro-to-content separation |
| `--space-12` | `3rem` | Standard route section break |
| `--space-16` | `4rem` | Major desktop section break |
| `--space-20` | `5rem` | Homepage / route opening space |
| `--radius-sm` | `0.25rem` | Buttons and control corners only |
| `--radius-lg` | `0.875rem` | Contact and certificate dialogs only |
| `--header-height` | `4rem` | Persistent header height |
| `--content-max` | `67.5rem` | Shared route content maximum |
| `--prose-max` | `42rem` | Reading measure |

### Layout grammar

- The document owns vertical scrolling. No homepage pane, record list, dialog body, or mobile nav may create a competing page scroll unless its content is explicitly a modal body that must scroll inside a viewport-safe dialog.
- Shared shell: 64px header; centered `--content-max` container; `--space-6` desktop inline gutter; `--space-4` mobile inline gutter. All main routes are unframed editorial columns with hairline rules, not card grids.
- At desktop, `EditorialIntro` establishes a narrow text column before a broader data field. `ProjectIndexItem`, `AchievementLedger`, and `ResearchArchive` use rows with a fixed metadata rail and fluid content rail. Let source text grow vertically.
- Homepage retains the approved two-field identity composition: an image/evidence field beside an identity field at `>=1024px`; a `38% / 62%` visual split at `768px-1023px`; and direct order of greeting, portrait, then profile action below `768px`. The portrait uses its Profile-owned media and remains uncropped (`object-fit: contain`).
- Use semantic `main`, `header`, `nav`, `section`, `article`, `figure`, `figcaption`, `dialog`, and `footer`. Do not add a floating rail, dashboard sidebar, hero metric cards, or rounded-card grid.

### Responsive and zoom contract

| Context | Required behavior |
| --- | --- |
| `375x812` | One readable column; menu is an explicit control; rows can stack metadata above content; 44px minimum pointer targets; dialogs use safe insets; no horizontal page scroll. |
| `768x1024` | Header remains 64px; inline navigation fits or moves to an accessible menu; editorial rails remain legible; project and archive rows may retain a compact two-column scan order. |
| `1280x900` | Full editorial rail and record columns; homepage two-field composition; footer stays after content; no overwide prose. |
| `200%` browser zoom | Reflow rather than clip; no loss of navigation, language link, dialog close control, source labels, captions, or record evidence; do not rely on hover for essential information. |

Test each context in Chinese and English. Long labels, unavailable links, long project titles, and certificate filenames are required content-stress cases.

### Routes, locale, and compatibility

Chinese is the default locale at the base-aware root. English is a mirror under `/en/`. Internal links must be generated with a base-aware route helper configured for `/joeych-pages`; no component may hard-code root-relative internal URLs.

| Canonical Chinese route | English mirror | Navigation label | Source-backed purpose | Compatibility intent |
| --- | --- | --- | --- | --- |
| `/` | `/en/` | 自我介绍 / About | Identity, approved summary, education preview, featured evidence | Preserve the Jekyll `/index.html` destination and `/about.html` intent without making a second About page. |
| `/experience/` | `/en/experience/` | 个人经历 / Experience | Education and campus experience | Preserve `/experience.html` meaning and content order. |
| `/awards/` | `/en/awards/` | 获奖证书 / Awards | Award chronology, publications, patents, and thesis archive | Preserve `/awards.html` meaning; do not split source-backed research records into unsupported routes. |
| `/projects/` | `/en/projects/` | 项目介绍 / Projects | Numbered project index and full evidence records | Preserve `/projects.html` anchors using stable Profile project IDs. |
| `/tech-stack/` | `/en/tech-stack/` | 技术栈 / Tech Stack | Evidence-backed professional skill groups | Preserve `/tech-stack.html` purpose; do not create ratings or a separate learning taxonomy. |

The future implementation may provide explicit static compatibility redirects only after approval. This contract defers deployment only to the root GitHub Pages exception; it does not authorize host configuration or new routes beyond the ten canonical locale paths above.

## 5. Components & Primitive Showcase

Before composing full routes, build a primitive showcase containing every state named below at 375px, 768px, 1280px, and 200% zoom in both locales. The showcase is an implementation verification harness, not a public route.

### Shared component rules

- All labels, records, links, figures, certificates, and media derive from Profile data and media only. Render absent source values as an explicit unavailable label, never a guessed link or filler copy.
- Every interactive component has default, hover, active, focus-visible, disabled/unavailable where applicable, and touch-reachable behavior. Focus is a 2px `--color-signal-fg` outline with 2px offset.
- Icons are inline SVGs with accessible names when meaningful and `aria-hidden` when paired with visible text. No emoji icons.

### `SiteHeader`

- **Structure:** wordmark/home link, primary navigation for the five canonical route concepts, `LanguageLink`, contact trigger, and an accessible compact-navigation control below the desktop breakpoint.
- **Layout:** 64px structural gunmetal band, with paper or translucent ice content field only if it maintains clear text contrast. The header is sticky; it never hides on scroll.
- **States:** current route uses cyan signal and `aria-current="page"`; hover and focus expose the signal rail; mobile menu opens via a labelled button and closes with Escape, outside action, or route change.
- **Accessibility:** menu button communicates `aria-expanded` and controls the menu region. The language link and contact trigger remain visible/reachable at every viewport and 200% zoom.

### `SiteFooter`

- **Structure:** Profile-derived contact email and only approved GitHub, Google Scholar, and ORCID links; a concise identity line may use the Profile name.
- **Layout:** gunmetal field after all main content with a paper/ice rule and no secondary sitemap, copyright filler, phone, hometown, political status, or duplicated route navigation.
- **States:** external links show textual destination context; hover/focus use cyan signal. Links use `rel="noopener noreferrer"` when opening a new tab.

### `EditorialIntro`

- **Structure:** one overline, one localized H1, and source-backed introductory copy.
- **Layout:** paper field followed by a rule and the route’s data surface; no hero cards, metric tiles, or stock imagery.
- **States:** static; the intro does not animate on scroll.

### `LanguageLink`

- **Structure:** one normal anchor pointing to the exact locale counterpart, with visible locale text and localized `hreflang`, `title`, and `aria-label`.
- **States:** default, hover/focus cyan foreground, active pressed state. Its compact form cannot hide the language name at 200% zoom.
- **Accessibility:** preserve current route segment and project hash where a counterpart exists. If a precise counterpart cannot exist, link to the matching locale route, disclose the destination in its accessible name, and never depend on a first-visit redirect or local storage.

### `ContactDialog`

- **Structure:** native `<dialog>` containing localized title, Profile-backed email/GitHub/Scholar/ORCID links, close button, and no contact facts outside the approved source list.
- **Layout:** `--color-paper` elevated surface, `--radius-lg`, `--space-6` padding, ice backdrop, maximum width based on readable content rather than a card grid.
- **States:** closed, opening/open, focus-within, closing, and unavailable-link omission. The trigger uses `aria-haspopup="dialog"` and `aria-controls`.
- **Accessibility:** move focus to the dialog title or first link on open; Escape, close button, and backdrop action close it; restore focus to trigger; keep focus within the native modal. The dialog must fit safe mobile insets and scroll its own body only if content exceeds viewport height.

### `CertificateDialog`

- **Structure:** native `<dialog>` with localized certificate title, Profile-associated media image, always-visible localized caption, previous/next controls only when an owning source record has multiple certificates, and close button.
- **States:** closed, opening/open, image loading, image unavailable, previous/next boundary disabled, and closing. Image failure exposes the source-provided caption and a clear unavailable state rather than a blank panel.
- **Accessibility:** certificate triggers are buttons with source-provided accessible names; modal behavior matches `ContactDialog`; the image receives source-provided alt text and never conveys evidence only through color.

### `ProjectIndexItem`

- **Structure:** one anchor to a stable project ID with numbered metadata, localized title, category, year, and directional SVG indicator.
- **Layout:** rule-separated editorial row with a fixed number/year rail and fluid title field; no thumbnail-dependent comprehension and no truncation of source text.
- **States:** default, hover/focus signal rail, active pressed, and target state when URL hash matches. The row’s signal rail uses the signature interaction below.

### `ProjectRecord`

- **Structure:** `article` with stable `id`, number/year metadata, localized title, claim, category, summary, optional source-backed contribution, tags, optional figures with `figcaption`, and only valid source-backed links.
- **Layout:** full-width evidence record after the compact index; figures keep their captions visible and preserve source order. Records with no image or figures remain complete as text.
- **States:** default, hash target, valid external-link hover/focus, and unavailable-link label. Do not hide contribution, figure captions, or evidence behind hover.

### `AchievementLedger`

- **Structure:** year heading followed by source-order award rows: localized title, literal Profile prize labels, and certificate trigger when associations exist.
- **Layout:** chronological ledger with a narrow date rail and ruled rows. Award gold is limited to applicable top-tier source-backed prize label.
- **States:** default, hover/focus on certificate trigger, selected certificate trigger, no-certificate static row, and empty section omission when Profile has no records.

### `ResearchArchive`

- **Structure:** separate compact subsections for publications, patent applications, and the one thesis record. Each row includes localized title, venue when supplied, author position when supplied, year, source tags, and certificate trigger when supplied.
- **Layout:** dense but breathable evidence ledger inspired by academic bibliography scanning: title leads, then venue/authorship/year metadata. No citations, DOIs, counts, publication status, abstracts, or bibliography fields unless Profile supplies them.
- **States:** default, certificate trigger hover/focus, unavailable/absent link label, and omitted optional metadata. It must not manufacture a publication type or acceptance claim.

### `SkillGroup`

- **Structure:** semantic section with localized group title, Profile tag list, components/evidence disclosures only when rendering approved evidence wording, and source-backed project linkage.
- **Layout:** unboxed grouped lists with rule-separated tags; no bar charts, star scores, proficiency scales, or visual ranking. Do not import the archived Jekyll learning map as professional evidence.
- **States:** static tags; source project links have hover/focus/active. Self-described working or exposure context must remain distinct from credential or project evidence.

### `SeoHead`

- **Structure:** one centralized head primitive receives route-localized title, description, canonical path, locale alternate, and optional Profile-derived social image.
- **Requirements:** emit `<title>`, description, canonical URL, language, `hreflang` alternate pair, Open Graph title/description/locale/URL/image only when an approved image exists, and a semantic person/profile graph only from public Profile fields.
- **Constraints:** paths are base-aware for `/joeych-pages`; no analytics, tracking, machine endpoints, AI metadata, unapproved claims, dynamic remote images, or generated content pipeline.

### Primitive showcase acceptance states

The showcase must demonstrate: header desktop/current/mobile-open; footer external-link focus; both locale links; dialog open/close/focus restoration; certificate dialog image loading, unavailable, and multi-certificate boundaries; project row hover/focus/hash target; project record with/without figures and contribution; award row with/without certificate; research records with optional metadata missing; skill evidence type distinctions; and `SeoHead` output inspection for both locales. No implementation agent may substitute a generic card, pill, or hardcoded demo record for these states.

## 6. Motion & Interaction

### Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `--motion-fast` | `120ms` | Press and color feedback |
| `--motion-standard` | `180ms` | Signal rail, hover/focus state |
| `--motion-dialog` | `220ms` | Dialog opacity/transform entry and exit |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Color and opacity |
| `--ease-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)` | Small spatial settle |

Only `transform`, `opacity`, and `filter` may animate. Never use `transition: all`, scroll-driven animation, parallax, autoplay, route transitions, layout-property animation, or decorative motion.

### Signature interaction: signal-rail shared focus

`ProjectIndexItem` and the primary `SiteHeader` navigation share a restrained rail mechanism derived from the local interaction-reference pattern of a shared layout background, adapted without importing a motion library. One cyan 2px rail occupies the active or most-recently hovered/focused item; it translates between sibling anchor positions with a short CSS transform transition. It clarifies the current reading target and route location, so it is not decorative.

- Pointer hover and keyboard focus move the rail to the relevant target; `aria-current` or URL hash defines the resting rail after pointer exit.
- The source item remains readable without the rail through text color, underline/focus outline, and `aria-current`; no meaning is hover-only.
- On touch/coarse-pointer layouts, only the current route or hash target rail is shown. Tapping does not require a first hover.
- Under `prefers-reduced-motion: reduce`, the rail changes state instantly with no transform. Dialogs open/close without transform animation; all controls and information remain visible.

## 7. Depth & Surface

### Strategy: ruled tonal fields

Depth comes from paper-to-ice tonal shifts, gunmetal inversion, and precise `--color-rule` separators. It does not use shadows on rows, glass blur, floating rounded cards, gradients, or textured decoration.

| Surface | Treatment | Use |
| --- | --- | --- |
| Editorial paper | `--color-paper` with `1px solid var(--color-rule)` separators | Main document, records, route intro |
| Ice field | `--color-ice` inset field; optional `--color-ice-strong` edge | Secondary intro band, dialog backdrop context |
| Gunmetal field | `--color-gunmetal`; paper text; cyan signal only | Header, footer, homepage profile action |
| Dialog elevation | Paper surface with `--radius-lg` and `0 1rem 3rem rgb(44 49 58 / 0.24)` | Contact and certificate dialogs only |

The sole dialog shadow is functional elevation above its backdrop. No shadows are permitted on project, achievement, publication, skill, or navigation rows. Images are evidence: they receive a rule and caption, not a decorative frame or hover zoom.

## 8. Accessibility Constraints & Accepted Debt

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
- Validate every canonical route in both locales at `375x812`, `768x1024`, `1280x900`, and 200% zoom. Future visual QA must exercise hover, focus, active, dialog, certificate boundary, locale, and reduced-motion paths.

### Accepted debt

No accepted design, accessibility, content, or implementation debt exists initially. Future debt may be accepted only with a concrete location, affected persona, severity, rationale, owner, exit condition, and explicit user acknowledgement for accessibility debt.

| Item | Location | Why accepted | Owner / exit |
| --- | --- | --- | --- |
| None | N/A | N/A | N/A |

### Must-not constraints

- Do not add dark mode, search, CMS, React, SSR, analytics, AI/Ask/MCP, deployment workflow outside the root GitHub Pages exception, decorative motion, purple AI gradients, rounded-card grids, unsupported claims, or additional public routes.
- Do not add publication counts, DOI, citation counts, affiliations, performance metrics, image associations, project contribution, skill level, or certificates that are not explicitly in Profile.
- Do not copy a Demo theme or user-facing copy. Do not add broad hosting, publishing, or deployment instructions to this implementation contract; defer only to the root GitHub Pages exception.
- Do not modify Profile schemas or data to satisfy presentation. Extend this design system before adding a genuinely new reusable visual token, primitive, state, motion mechanism, accessibility constraint, or accepted debt.
