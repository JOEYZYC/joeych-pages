# Third-Party Icons

This site uses Font Awesome Free only through local npm packages and Astro build-time SVG rendering. It does not use Font Awesome CSS, WebFonts, a CDN, Kit, account, token, Pro package, or a runtime icon registry.

## Packages and Roles

- `@fortawesome/fontawesome-svg-core@7.3.1`: build-time SVG Core API. License: MIT.
- `@fortawesome/free-solid-svg-icons@7.3.1`: selected Free solid icon definitions. License: CC BY 4.0 and MIT.
- `@fortawesome/free-brands-svg-icons@7.3.1`: selected Free brand icon definitions. License: CC BY 4.0 and MIT.

The package artifacts are third-party packaging from Font Awesome. The implementation must import named definitions only, generate inline SVG during the Astro build, and retain localized accessible names on the enclosing controls or links. No Font Awesome asset is loaded at runtime from a remote host.

## Attribution and Trademark Notice

Font Awesome Free 7.3.1 is used under its upstream license terms. Font Awesome icon artwork is licensed under CC BY 4.0, and SVG Core is licensed under MIT. Upstream license provenance is the immutable Font Awesome commit [`14c65a3747d0f3b751f15831fc719236aea8729d`](https://github.com/FortAwesome/Font-Awesome/blob/14c65a3747d0f3b751f15831fc719236aea8729d/LICENSE.txt).

Font Awesome and the Font Awesome logo are trademarks of Fonticons, Inc. This site does not claim affiliation with, sponsorship by, or endorsement from Font Awesome, Fonticons, Inc., or any brand represented by a brand icon. Brand icons are used only to identify the corresponding third-party service or destination and must not imply endorsement, partnership, or ownership.

## Regeneration and Updates

To update Font Awesome, select explicit matching package versions, review the upstream license and trademark terms at an immutable commit, update this document and `pnpm-lock.yaml` together, then run the static asset and network checks. Do not replace this integration with a CDN, Kit, WebFont, whole-style import, regular or Pro package, or copied SVG path data.
