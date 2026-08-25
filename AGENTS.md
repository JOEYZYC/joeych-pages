# Repository Guidelines

## Project Overview

- `Profile/` is the fully public, framework-neutral source package.
- `Astro/` is the active Astro 6 static site.
- `Jeklly/` is a non-runnable historical archive.
- `.github/workflows/deploy-pages.yml` is the only deployment path.

## Data Flow

1. `Profile/site/`, `home/`, `about/`, `projects/`, and `tech-stack/` correspond to shared, Home, About, Projects, and Tech Stack content.
2. `Profile/projects/index.yml` owns project order; each project owns embedded outcomes and colocated files.
3. `Astro/src/lib/profile-data.ts` loads page bundles and projects concurrently, validates Zod schemas and media, then produces static pages.
4. Astro serves the entire `Profile/` directory publicly and emits eight documents to `Astro/dist/` under `/joeych-pages`.

## Boundaries

- `Profile/private/` and retired `Profile/profile/` must not exist; Astro refuses to build if either is recreated.
- Do not recreate `Profile/data/`, `Profile/media/`, separate outcome registries, or authored mirrors.
- Keep `Astro/Demo/`, `Astro/research/`, `Jeklly/archive/local/`, generated Jekyll mirrors, `.tmp-build/`, `.omo/`, `.playwright-mcp/`, `.codegraph/`, package directories, and generated test/build output local-only.
- Do not create nested repositories, submodules, a `gh-pages` branch, `CNAME`, custom domains, or alternate deployment workflows.
- The only deployable artifact is `Astro/dist/`.

## Content Rules

- Preserve stable project IDs and `projects/index.yml` order.
- Directory name, index ID, YAML ID, skill evidence ID, and project anchor must agree.
- Parsed YAML is `unknown` until validated with Zod.
- Media references are same-directory filenames only; reject traversal, encoded paths, cross-project references, missing files, and symlinks.
- Projects require bilingual title, claim, category, summary, and contribution plus `awards`, `publications`, and `patents` arrays.
- Publications and the thesis are projects. Outcomes are embedded only in their owning project.
- Use source-backed facts only. Use the existing pending literals when detail is unavailable.

## Routes and Browser Behavior

- Preserve the four route IDs and eight canonical trailing-slash URLs: home, about, projects, and tech-stack in Chinese and English.
- Use `getRoutePath()`/`withBase()` for internal links and `publicMediaUrl()` for public files.
- Keep browser behavior local and progressive with native DOM APIs, dialogs, focus restoration, Escape handling, reduced-motion support, ARIA state, and no client framework.
- Preserve the accepted dark accent contrast debt until the site owner changes `#176b45`; tests must report it explicitly rather than hiding it.

## Development

Run from `Astro/` with Node `>=22.12.0` and pnpm `11.18.0`:

| Task | Command |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` |
| Develop | `pnpm run dev` |
| Check | `pnpm run check` |
| Lint | `pnpm run lint` |
| Unit tests | `pnpm run test:unit` |
| Build | `pnpm run build` |
| E2E | `pnpm run test:e2e` |
| Required verification | `pnpm run verify` |

Use `devrun node-24 -- pnpm <args>` for deterministic automation. TypeScript extends Astro strictest; Biome forbids explicit `any`, non-null assertions, parameter reassignment, and value imports used only as types. Follow existing two-space, double-quote, no-semicolon style.

Run `pnpm run verify` for content, schema, route, style, or site changes. Run E2E for navigation, dialogs, responsive behavior, client interaction, or accessibility. Test 375x812, 768x1024, 1280x900, no-JS, both locales/themes, reduced motion, keyboard/focus behavior, and 200% reflow.
