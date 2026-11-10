# One chip, five compositions

The owner-approved November 2026 direction applies to **all four routes**, not just Home. Expressive C typography, warm paper and ink, an original 24-pin chip, and quiet editorial readers replace the previous Apple-style shell. Rauno is an interaction reference, not a copied layout, asset or source. The accepted offline `site-chip-concept.html` is the visual reference, not a deployable document or content source.

## Composition

- **No persistent header bar.** A compact corner directory opens on demand at every width. Its real route anchors, locale link, theme control and contact dialog remain keyboard reachable. Escape returns focus to the directory summary. With no JavaScript, ordinary expanded navigation/contact anchors precede the readable document.
- Home has five full-screen compositions: Curiosity, Making, Signal, Connections, Still curious. They are content states (`#chapter-0` … `#chapter-4`), **not new route IDs**. Each composition differs: large personal typography; board and architectural paper field; offset research figure and headline; ink connection ledger; personal chronology.
- Home copy and chapter selections belong to `Profile/home/home.yml`. The loader validates every project reference. Existing `selected_project_ids` remain compatible; they do not control the five-scene topology.
- About and Tech Stack use normally scrolling readers with the same typography, rules, space and corner directory. Projects is a source-ordered index; its stable project hashes open substantial full-screen readers using the existing native dialog/history machinery. Without JS, all complete records remain visible.
- Readers use wide titles, generous outer margins, restrained one-pixel section rules, and a narrow reading measure. The existing `--prose-max: 45rem` remains the default prose token. No generic repeated slide cards, dashboard chrome, wallpaper or portrait substitutes.

## The shared graphic

`SharedChip.astro` emits exactly one original decorative SVG per document: 24 pins, rounded package, inset die, open-loop mark, traces and field contours. It is not a project figure or a real circuit claim. It has no accessible name or tab stop; its clipped overlay is `aria-hidden="true"` and `pointer-events: none`.

`chip-site.ts` samples the actual fractional native rail position. Package/die/pin geometry, fill, traces, contours, scale, position and rotation change together. The same SVG node is reused, including when it is moved into the project dialog's top layer. In readers it docks small in reserved upper-toolbar space. Cross-document View Transitions are progressive CSS enhancements; the named chip snapshot docks without sweeping a large package over new reading text. Unsupported browsers use ordinary anchors.

The normal scene move lasts 620ms. Rail and graphic paint atomically on the same bounded RAF. Between compositions the graphic shrinks and uses a clipped top/edge transit lane clear of text, images and controls. **Text is never scaled.** No independent slide entrances, idle floating, body scroll lock, perpetual RAF or client router.

## Input, focus and fallback

- Native horizontal overflow and snap preserve touch scrolling. Buttons and chapter links offer a non-gesture alternative. Vertical wheel gestures are intercepted **only over the canvas**, only when consumable, with a bounded one-scene gesture lock. Modifier/zoom gestures, form fields and both end boundaries retain native browser behavior.
- Arrow/Page keys are scoped to the rail; Home/End select its first/last chapter. Moving with a keyboard hands focus to the destination chapter before the next Tab. Direct descendant focus, forward/reverse Tab and resize align the actual native `scrollLeft`, never add a second transform.
- Reduced motion keeps the horizontal topology and stable final states but moves instantly. Short layouts below 520px, widths below 340px, or enlarged root text above 22px use source-ordered vertical reading. At 200% text/reflow, content wraps rather than clips. All long reader content scrolls normally.
- Origin chapter/link is retained for ordinary detail entry and Home return; native history/back/forward and stable hashes continue to work. Storage is guarded and not required for basic navigation.
- RAF is event-driven and ends when settled or hidden. Late fonts and resize remeasure while retaining focused content. Physical touch, OS zoom and real hidden-tab lifecycle require actual devices/windows; emulation must be identified as such.

## Content and routes

`Profile/` is the sole authored public source. Zod validates unknown YAML, bilingual facts and project/evidence references before rendering. Preserve all 20 projects in `projects/index.yml` order, their IDs/anchors and featured flags. Awards, patents, publications, figures and certificates stay with their owning project. Pending contribution values remain pending. Drone media is explicitly a 3D render and physical testing remains incomplete.

Exactly four route IDs / eight canonical trailing-slash documents remain: Home, About, Projects, Tech Stack in Chinese and English. Use `getRoutePath()` / `withBase()` and validated `publicMediaUrl()` references under `/joeych-pages`. No SPA, client framework, dependency/config change, extra route, authored mirror, private fact, alternate deployment path or imported prototype HTML.

Only `Astro/dist/` deploys through the existing GitHub Pages workflow. `Profile/private/`, retired `Profile/profile/`, generated authored mirrors, local prototypes and test output must not be published.

## Typography and licensing

- Site-wide display: self-hosted **Home Maple Subset**, 600. Body/control prose: **Home Noto Subset**, 400/600. These stable family names and three WOFF paths are retained for compatibility while the separate font lane expands the inventory to the full public site. No `local()` font dependence, external service, copied font install or CDN.
- Technical metadata uses the existing local **Google Sans Code** through `--font-mono`. Existing DM Sans configuration/preload remains English-only; it does not override the approved display/body families.
- Complete OFL and NOTICE text is distributed in a reachable site-wide disclosure. Font provenance/glyph input hashes are generated by the dedicated font lane, never by UI code.
- Unchanged budgets: **6 MiB** total cold font transfer, **42 MiB** total emitted fonts, **256 KiB** selected Google Sans Code. Count **WOFF and WOFF2**. The three new derived subsets together must remain under 1 MiB. Actual CDP custom-font rendering evidence is required, not merely successful font requests.

## Color and controls

The Flexoki-inspired semantic palette remains in `tokens.css`: warm paper `#fffcf0`, ink `#100f0f`, cyan accent `#1c6c66` / dark `#5abdac`, supporting text `#575653` / `#b7b5ac`, warning `#9d4310` / `#ec8b49`. The connection composition uses semantic ink/paper/mint tokens in both themes. Decorative SVG interpolation does not change content contrast.

`--color-control-hover` is the ordinary interactive foreground; `--color-on-strong-hover` is used on ink surfaces. Verify text >=4.5:1, focus and essential boundaries >=3:1 in both themes; the old dark green exception is retired. Controls have at least 44px targets and visible focus; disabled states retain non-color cues. Quiet section separators are not control boundaries. Status and current state remain readable text plus semantics, never color alone.

Theme initialization still runs before visible paint. A valid guarded stored override wins over system preference; otherwise the document follows system changes. No-JS uses complete CSS system mappings. Theme changes never change facts or project order.

## Verification and evidence

Focused production checks cover desktop/mobile working overview first, then structured/detail behavior: direct descendant focus; Tab/reverse/Arrow/PageDown then Tab; resize; wheel/boundaries; history/back/forward/hash/refresh/return focus; all eight documents and 20 records; both locales/themes; no-JS; reduced motion; 375×667/812, 768×1024, 1280×720/900 and 200% reflow.

Collision probes check terminal **and fractional** SVG painted bounds, clipped to the viewport and scene, against text/media/controls. They are conservative geometric evidence, not a substitute for visual review or live feel. Idle RAF and actual custom-font rendering are separate checks. Headless native visibility, physical touch and OS zoom must not be claimed when unavailable. No generated screenshot-golden updates.

Run only the assigned focused checks in the implementation lane. Parent owns final `pnpm run verify`, independent UI review, nonvisual E2E integration, commit and deployment. Existing security/resource/assertion coverage must be retargeted to the real design, never weakened or allowlisted.
