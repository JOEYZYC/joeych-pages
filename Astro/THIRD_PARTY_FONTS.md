# Third-Party Fonts

This static Astro site bundles all font bytes locally. It makes no runtime request to Google Fonts, Typekit, or another remote font host. Font files are emitted as base-aware build assets; `Profile/media/` remains content-only and does not contain fonts.

## Package Wrapper and Source Records

`@free-fonts/jigmo-sc@1.0.1` is the third-party package that supplies the Unicode-ranged CSS imported by [`src/styles/fonts.css`](src/styles/fonts.css). Its package metadata declares `MIT AND SIL-1.1`, but that metadata is not a single license for every bundled font asset. The package's [`LICENSE`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/LICENSE) applies MIT to the package wrapper/build code and explicitly directs readers to [`THIRD_PARTY_LICENSES.md`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/THIRD_PARTY_LICENSES.md) for the font and glyph-data terms. The sections below map every family actually declared by that package CSS.

## Family: Source Han Serif SC

- Emitted role: local Unicode-ranged Simplified Chinese editorial display face.
- Underlying font license: SIL Open Font License 1.1 (OFL-1.1).
- Upstream source: Adobe Source Han Serif immutable commit [`7889f11bf31170b5d092a083b357c8c8130f89e0`](https://github.com/adobe-fonts/source-han-serif/commit/7889f11bf31170b5d092a083b357c8c8130f89e0).
- Package evidence: `@free-fonts/jigmo-sc@1.0.1` identifies this family in [`jigmo-sc.css`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/jigmo-sc.css). The package license file explains that underlying font assets have their own licenses; consult the package's [`THIRD_PARTY_LICENSES.md`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/THIRD_PARTY_LICENSES.md) alongside this record.

## Family: Source Serif 4

- Emitted role: package-provided Unicode-ranged serif payload. It is emitted because the selected `jigmo-sc.css` declares it, even though the site does not assign it to a typography token.
- Underlying font license: SIL Open Font License 1.1 (OFL-1.1).
- Upstream source: Adobe Source Serif repository, identified by the package's [`THIRD_PARTY_LICENSES.md`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/THIRD_PARTY_LICENSES.md) as `https://github.com/adobe-fonts/source-serif`; this package license record does not provide an immutable Source Serif commit, so this document does not invent one.
- Package evidence: the same package license record states that Source Serif 4 was obtained through the Google Fonts API during package generation. That historical packaging provenance is not a runtime request from this site: the emitted WOFF2 assets are local.

## Family: Jigmo SC

- Emitted role: Unicode-ranged fallback coverage for rare CJK ideographs.
- Underlying Jigmo font source and license: Kamichikoichi's Jigmo font family, CC0 1.0 Universal. See the package's [`THIRD_PARTY_LICENSES.md`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/THIRD_PARTY_LICENSES.md) and [Jigmo source](https://kamichikoichi.github.io/jigmo/).
- Jigmo SC glyph-source terms: the SC variant is generated with GlyphWiki KAGE data. The package records the GlyphWiki data license as unlimited permission to use, copy, and distribute the data, with or without modification and without warranty. The exact notice is reproduced in the package's [`THIRD_PARTY_LICENSES.md`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/THIRD_PARTY_LICENSES.md).
- Wrapper/build-code distinction: the package wrapper/build code is MIT under [`LICENSE`](https://unpkg.com/@free-fonts/jigmo-sc@1.0.1/LICENSE); this does not replace the CC0 and GlyphWiki data terms governing the underlying glyph sources. The package also identifies a GPL-3.0 `kage-engine` as a non-vendored generation tool, not a runtime site dependency or emitted asset license.

## Family: Google Sans Code

- Package: `@fontsource-variable/google-sans-code@5.3.0`.
- Emitted role: Astro's local provider emits only `google-sans-code-latin-wght-normal.woff2`, a normal-style variable face with the `300 800` weight range. It is preloaded with `font-display: swap` for the technical metadata role.
- Underlying font license: SIL Open Font License 1.1 (OFL-1.1), as supplied in the package's [`LICENSE`](https://unpkg.com/@fontsource-variable/google-sans-code@5.3.0/LICENSE).
- Upstream provenance: Google Sans Code immutable commit [`f9e36cea20d34ecc9b61c09609fe02e1438364fc`](https://github.com/googlefonts/googlesans-code/commit/f9e36cea20d34ecc9b61c09609fe02e1438364fc). Fontsource is third-party self-hosting packaging, not the font author.

## Family: DM Sans

- Package: `@fontsource-variable/dm-sans@5.3.0`.
- Emitted role: Astro's local provider emits only `dm-sans-latin-wght-normal.woff2`, a normal-style variable face restricted to the `400 700` weight range. English documents preload it for display, body, and UI text; Chinese documents do not request it.
- Underlying font license: SIL Open Font License 1.1 (OFL-1.1), as supplied in the package's `LICENSE`.
- Upstream provenance: [Google Fonts DM Sans](https://github.com/googlefonts/dm-fonts). The package record does not identify an immutable upstream font commit, so this document does not invent one. Fontsource is third-party self-hosting packaging, not the font author.

## Regeneration and Updates

Do not copy fonts into `publicDir`, `Profile/`, or source control. To update a font package, select an explicit version, reread every applicable package license and underlying-asset record, update this document and `pnpm-lock.yaml` together, run `pnpm install --frozen-lockfile`, then rebuild and verify that each emitted family remains mapped to an accurate provenance section and all font URLs remain local and base-aware. Do not introduce italic variants, a full single-file CJK WOFF2, or a runtime font CDN.
