# Portable Profile Package

`Profile/` owns the framework-neutral public profile package shared by the workspace.

- `data/` contains the canonical public YAML records.
- `media/` contains the published media bytes and certificate hierarchy.
- `private/` contains ignored local-only contact material and raw originals. It is never part of the distributable package.

`Profile/` without `private/` is the complete public package. Do not create site-specific variants, aliases, overrides, or transformed authored copies. This directory provides data and media ownership only; it has no deployment, compilation, testing, or runtime support.
