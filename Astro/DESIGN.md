# One filled shape, five compositions

The owner-approved November 2026 direction applies to **all four routes**, not just Home. Expressive C typography, warm paper and ink, a simple filled circle, and quiet editorial readers replace the previous Apple-style shell. The November 11 production revision supersedes the detailed chip and invisible outer transit path. Rauno informs mechanisms (separate motion clocks, clipped title entry, layered settling), not artwork, source, layout or framework. Offline concepts are not deployable documents or content sources.

## Composition

- **No persistent header bar.** A compact corner directory opens on demand at every width. Its real route anchors, locale link, theme control and contact dialog remain keyboard reachable. Escape returns focus to the directory summary. With no JavaScript, ordinary expanded navigation/contact anchors precede the readable document.
- Home has five full-screen compositions: Curiosity, Making, Signal, Connections, Still curious. They are content states (`#chapter-0` … `#chapter-4`), **not new route IDs**. Each composition differs: large personal typography; board and architectural paper field; offset research figure and headline; ink connection ledger; personal chronology.
- Home copy and chapter selections belong to `Profile/home/home.yml`. The loader validates every project reference. Existing `selected_project_ids` remain compatible; they do not control the five-scene topology.
- About and Tech Stack use normally scrolling readers with the same typography, rules, space and corner directory. Projects is a source-ordered index; its stable project hashes open substantial full-screen readers using the existing native dialog/history machinery. Without JS, all complete records remain visible.
- Readers use wide titles, generous outer margins, restrained one-pixel section rules, and a narrow reading measure. The existing `--prose-max: 45rem` remains the default prose token. No generic repeated slide cards, dashboard chrome, wallpaper or portrait substitutes.

## The shared graphic

`SharedChip.astro` keeps its compatibility filename/hooks but emits exactly one filled SVG circle per document. No pins, circuit details, contours or caption. It is not a project figure or a real circuit claim. It has no accessible name or tab stop; its overlay is `aria-hidden="true"` and `pointer-events: none`.

`chip-site.ts` retains the actual native rail and one reused SVG node, including the project dialog's top layer. Shape diameter, position and semantic fill change independently of eased rail distance. In readers it docks small in reserved upper-toolbar space. Cross-document View Transitions remain progressive CSS enhancements; unsupported browsers use ordinary anchors.

Button/vertical-wheel/key moves use a bounded 1120ms sequence: shrink 160ms, lift into the visible upper band 160ms, native rail travel 520ms, arrive 120ms, resolve 160ms. Transit diameter is 64px desktop / 48px mobile, wholly within the viewport. The rail and shape paint on the same bounded RAF, but the shape clock is not derived from cubic-eased rail displacement. The chapter label and mobile research/title spacing reserve the transit band. Native horizontal touch/trackpad retains direct manipulation and a visible band pose at fractional positions, without imposing the programmatic clock.

Incoming headings settle by 18px; media/ledgers settle by 32px with 90ms follow-through. These translations end on a bounded timeline; focus reveal, resize, interruption, reduced motion or reflow cancels them immediately. **Text is never scaled.** A fresh unfragmented Home navigation has a short clipped title entrance and circle resolve, never awaited for navigation or fonts. Focus cancels the entrance; hashes, Back and reader restoration do not replay it. Final content is the default CSS/DOM state, so failed JS/fonts/animation cannot leave it hidden. No idle floating, body scroll lock, perpetual RAF or client router.

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

Collision probes check terminal **and fractional** actual circle geometry against text/media/controls. Bounded RAF probes additionally measure visible fraction, minimum painted diameter, independently changing fill/size and incoming title/media translations during Next and vertical-wheel moves. They are geometric evidence, not a substitute for screenshot review or live feel. Idle RAF and actual custom-font rendering are separate checks. Headless native visibility, physical touch and OS zoom must not be claimed when unavailable. No generated screenshot-golden updates.

Run only the assigned focused checks in the implementation lane. Parent owns final `pnpm run verify`, independent UI review, nonvisual E2E integration, commit and deployment. Existing security/resource/assertion coverage must be retargeted to the real design, never weakened or allowlisted.
