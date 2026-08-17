# Repository Guidelines

## Project Overview

This repository is one Git control plane for a public portfolio:

- `Profile/` owns the canonical, framework-neutral public data and media.
- `Astro/` is the active Astro 6 static site that consumes those sources directly.
- `Jeklly/` is a non-runnable, non-deployed Jekyll source archive kept for history.

The site is published to GitHub Pages only by `.github/workflows/deploy-pages.yml`. Keep exactly one `.git` directory at the repository root.

## Architecture & Data Flow

1. Public facts are authored in six files under `Profile/data/`: `profile.yml`, `projects.yml`, `awards.yml`, `publications.yml`, `patents.yml`, and `thesis.yml`. Referenced public files live in `Profile/media/`.
2. `Astro/src/content.config.ts` registers those YAML files as content collections. `Astro/src/lib/profile-data.ts` reads them concurrently, parses YAML, validates Zod schemas, checks cross-record references, and confirms referenced media exists.
3. Thin route files in `Astro/src/pages/` select `zh` or `en` and delegate to shared page components in `Astro/src/components/pages/`.
4. Page components await `getProfileData()`, select localized `{ zh, en }` values, and render through `Astro/src/layouts/BaseLayout.astro` plus reusable presentational components.
5. Astro emits a fully static site to `Astro/dist/`. `Astro/astro.config.ts` serves `Profile/media/` directly as the public directory and applies the `/joeych-pages` deployment base.

There is no application server, dependency-injection container, or global state store. Most logic runs at build time; small client interactions use scoped vanilla TypeScript, native dialogs, `data-*` hooks, and ARIA state.

## Key Directories

- `Profile/data/`: canonical public YAML. Preserve stable IDs, ordering, record shapes, and bilingual fields.
- `Profile/media/`: canonical published media. YAML records own their media references.
- `Astro/src/pages/`: ten route entries: five Chinese root routes and five `/en/` equivalents.
- `Astro/src/components/`: page sections, records, dialogs, header/footer, and shared page implementations.
- `Astro/src/content/`: YAML loaders and Zod schemas.
- `Astro/src/lib/`: profile loading, validation, routes, URLs, SEO, media, and path safety.
- `Astro/src/i18n/`: locale types and static UI copy.
- `Astro/src/styles/`: shared CSS layers and page-specific styles.
- `Astro/tests/`: Vitest contract tests; `Astro/tests/e2e/` contains Playwright browser tests.
- `TOOLS/`: guarded Windows helper scripts for local preview and verified pushes.
- `Jeklly/`: historical Liquid/Jekyll source only; do not treat it as the active app or content source.

## Repository and Publication Boundaries

- Never read, stage, copy, or publish `Profile/private/`. Keep `Astro/Demo/` and `Astro/research/` local-only; never stage, import, build, or publish them.
- Keep `Jeklly/archive/local/` and `.tmp-build/` local-only.
- Treat `Jeklly/_data/`, `Jeklly/assets/img/`, and `Jeklly/.generated/` as ignored generated mirrors, not authored sources.
- Preserve ignores for `.omo/`, `.playwright-mcp/`, `.codegraph/`, `node_modules/`, generated build/test output, screenshots, and raw originals.
- Keep public `Profile/data/`, `Profile/media/`, `Profile/README.md`, and `Astro/README.md` trackable.
- Do not create nested repositories, submodules, gitlinks, a `gh-pages` branch, `CNAME`, alternate deployment workflows/scripts, custom domains, or another hosting path.
- The only deployable artifact is `Astro/dist/`, uploaded by the root Pages workflow. Do not publish root or Jeklly content.
- If Git operations are requested, stage explicit paths only; never use broad staging, repository-wide wildcards, force-pushes, or broad artifact uploads.

## Development Commands

Run package commands from `Astro/`:

| Task | Command |
| --- | --- |
| Install exactly from lockfile | `pnpm install --frozen-lockfile` |
| Development server | `pnpm run dev` |
| Astro/type checks | `pnpm run check` |
| Lint TypeScript/config files | `pnpm run lint` |
| Unit tests | `pnpm run test:unit` |
| Static build | `pnpm run build` |
| Preview at `127.0.0.1:4321` | `pnpm run preview` |
| Playwright E2E | `pnpm run test:e2e` |
| Required aggregate verification | `pnpm run verify` |

`pnpm run verify` runs check, lint, unit tests, and build. From the repository root, `./TOOLS/Start-AstroPreview.ps1` performs a frozen install and starts the local development server.

## Code Conventions & Common Patterns

- TypeScript is ESM and extends `astro/tsconfigs/strictest`. Prefer `readonly` props/data, narrow unions, exhaustive records, and `import type`.
- Biome enforces recommended rules plus no explicit `any`, non-null assertions, parameter reassignment, or value imports used only as types. Its formatter is disabled; follow the existing 2-space, double-quote, no-semicolon style and avoid unrelated reformatting.
- Astro components use PascalCase filenames; utility modules use descriptive kebab-case names. Tests use `*.test.ts`; E2E specs use `*.spec.ts`.
- Treat parsed YAML as `unknown`, validate at the boundary with Zod, then pass typed data through component props. Do not add site-specific data copies, aliases, overrides, or transformed authored mirrors.
- Keep errors source-specific. Existing loaders wrap failures in typed errors such as `ProfileContentError`, preserve `cause`, and include the failing file/path in the message.
- Parallelize independent filesystem checks with `Promise.all`; do not serialize the six profile reads or media existence checks.
- Use `getRoutePath()`/`withBase()` from `Astro/src/lib/routes.ts` and `publicMediaUrl()` from `Astro/src/lib/urls.ts`. Never hand-write root-relative internal links or asset URLs; they break the deployment base.
- Preserve the five route IDs and ten canonical trailing-slash URLs. Do not restore retired `showcase`/RSS routes or expand the public route set without an explicit requirement.
- Keep browser behavior local and progressive: native DOM APIs, focus restoration, Escape handling, reduced-motion support, and semantic/ARIA state. Avoid introducing a client framework or global store for local interactions.
- Content claims must be source-backed. When editing `Profile/`, follow `Profile/AGENTS.md`; preserve bilingual `{ zh, en }` values, stable IDs/order, project evidence links, and certificate paths under `assets/img/certificates/`.

## Important Files

- `README.md`: workspace ownership and publication summary.
- `Profile/AGENTS.md`: detailed public-data schema and editing rules.
- `Astro/package.json`: authoritative scripts, runtime engine, package-manager pin, and dependencies.
- `Astro/astro.config.ts`: static output, canonical site, base path, trailing slashes, sitemap, fonts, and public media directory.
- `Astro/src/content.config.ts`: six Profile-backed Astro collections.
- `Astro/src/lib/profile-data.ts`: end-to-end data parsing and validation.
- `Astro/src/lib/routes.ts` and `Astro/src/lib/urls.ts`: base-aware routing and URL generation.
- `Astro/src/layouts/BaseLayout.astro`: document shell, SEO, navigation, footer, and shared client behavior.
- `Astro/biome.json`, `Astro/tsconfig.json`, `Astro/vitest.config.ts`, `Astro/playwright.config.ts`: lint, type, and test policy.
- `Astro/DESIGN.md`: visual, responsive, interaction, and accessibility acceptance criteria.
- `.github/workflows/deploy-pages.yml`: sole authorized site publication path.

## Runtime/Tooling Preferences

- Required locally: Node.js `>=22.12.0` and pnpm `11.18.0`; CI currently uses Node 24. Do not substitute Bun, npm, or Yarn.
- The repository-root `.devtools.json` pins Profile `node-24`, Node `24.16.0`, and pnpm `11.18.0`. Validate it with `pwsh -NoProfile -File D:/Dev/ProjectTools/verify.ps1 -Project .. -Json` when working from `Astro/`.
- For deterministic agent automation, run package commands as `devrun node-24 -- pnpm <args>` from `Astro/`; direct `pnpm` remains acceptable for an already validated interactive shell.
- Keep `Astro/pnpm-lock.yaml` authoritative and use frozen installs in verification/automation.
- The active implementation is static Astro with vanilla TypeScript/CSS. Do not add SSR, React, a CMS, analytics, search, runtime CDN assets, or another deployment provider unless explicitly approved.
- Biome does not format `.astro` files and formatting is globally disabled; `pnpm run lint` is a lint check, not a formatting command.
- Generated directories such as `Astro/.astro/`, `Astro/dist/`, `Astro/coverage/`, `Astro/test-results/`, and `Astro/playwright-report/` are not source.
- `Jeklly/` and `Profile/` have no package-manager, build, test, or runtime commands of their own.

## Testing & QA

- Unit tests: Vitest files in `Astro/tests/**/*.test.ts`. They cover schemas/data, configuration, routes/URLs/SEO, fonts, dialogs, workflow rules, and the publication firewall.
- E2E tests: Playwright files in `Astro/tests/e2e/**/*.spec.ts`, using Chrome against a fresh `pnpm run build && pnpm run preview` server under `/joeych-pages/`.
- Run `pnpm run verify` before completing site, content-schema, style, or route changes. Also run `pnpm run test:e2e` for navigation, dialogs, responsive behavior, client interaction, or accessibility changes.
- Browser QA must preserve both locales, exactly ten canonical routes, base-aware links/media, keyboard/focus behavior, reduced motion, native dialog behavior, and WCAG 2.2 AA expectations. Relevant viewport checks include `375x812`, `768x1024`, `1280x900`, and 200% zoom/reflow.
- CI runs `pnpm run verify` but not Playwright E2E; behavior-changing work must run E2E locally.
- No coverage command or threshold is configured. Do not invent one; add coverage policy only when explicitly requested.
