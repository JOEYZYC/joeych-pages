# Third-Party Fonts

This site bundles font assets during the static Astro build. It makes no runtime request to Google Fonts, Typekit, or another remote font host. Font files are emitted as base-aware local build assets; `Profile/media/` remains content-only and does not contain fonts.

## Editorial Display and CJK Coverage

- Package: `@free-fonts/jigmo-sc@1.0.1`.
- Role: the package's Unicode-ranged `jigmo-sc.css` supplies local Source Han Serif SC coverage for editorial display text and Jigmo SC fallback coverage for rare CJK ideographs. CSS range matching means a browser requests only needed chunks.
- Third-party packaging: the npm package is published by the Jigmo Webfonts project (`frankslin/jigmo-webfonts`) and declares `MIT AND SIL-1.1`. Its generated CSS and bundled font assets remain third-party material, not site-authored fonts.
- Upstream Source Han Serif provenance: Adobe Source Han Serif immutable commit [`7889f11bf31170b5d092a083b357c8c8130f89e0`](https://github.com/adobe-fonts/source-han-serif/commit/7889f11bf31170b5d092a083b357c8c8130f89e0), licensed under the SIL Open Font License 1.1. The package's `LICENSE` and `THIRD_PARTY_LICENSES.md` remain the package-level license notices.

## Technical Metadata

- Package: `@fontsource-variable/google-sans-code@5.3.0`.
- Role: Astro's local font provider emits only `google-sans-code-latin-wght-normal.woff2`, a normal-style variable face with the `300 800` weight range. It is preloaded with `font-display: swap` for the technical metadata role.
- Third-party packaging: Fontsource packages the font for self-hosting; the package declares SIL Open Font License 1.1 and identifies its source as Google Sans Code.
- Upstream provenance: Google Sans Code immutable commit [`f9e36cea20d34ecc9b61c09609fe02e1438364fc`](https://github.com/googlefonts/googlesans-code/commit/f9e36cea20d34ecc9b61c09609fe02e1438364fc), licensed under the SIL Open Font License 1.1.

## Regeneration and Updates

Do not copy fonts into `publicDir`, `Profile/`, or source control. To update either font, select an explicit new package version, review its package license and upstream immutable revision, update this document and `pnpm-lock.yaml` together, run `pnpm install --frozen-lockfile`, then rebuild and verify that emitted font URLs remain local and base-aware. Do not introduce italic variants, a full single-file CJK WOFF2, or a runtime font CDN.
