# Portable Profile Package

`Profile/` is the complete framework-neutral public content and media package shared unchanged by both site contracts.

## Public Interface

- `data/` contains exactly six canonical YAML records: `profile.yml`, `projects.yml`, `awards.yml`, `publications.yml`, `patents.yml`, and `thesis.yml`.
- `media/` contains the published media bytes. YAML certificate paths retain their site-facing `assets/img/...` form and resolve to the same relative path below `media/`.
- Copying `Profile/` without `private/` is the complete distributable profile package. Consumers must not create site-specific variants, aliases, overrides, or transformed authored copies.

## Private Boundary

`private/` is ignored local-only material. It contains private contact data and raw originals, is not part of the distributable package, and must never be staged, published, traversed by synchronization, or read by either site.

## Jekyll Mirror

From the repository root, run:

```text
node tools/profile-sync.mjs --write
node tools/profile-sync.mjs --check
```

The first command cleanly recreates ignored byte-equivalent mirrors under `Jeklly/_data/` and `Jeklly/assets/img/` plus a SHA-256 manifest under `Jeklly/.generated/`. The second command is read-only and fails when any mirrored byte, path set, or manifest entry is stale.
