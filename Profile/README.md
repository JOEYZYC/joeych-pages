# Portable Profile Package

`Profile/` owns the framework-neutral public profile package shared by the workspace.

- `data/` contains the canonical public YAML records.
- `projects.yml` owns explicit project-to-achievement references; award and publication facts remain in their own YAML records.
- `media/` contains the published media bytes, organized to mirror `data/` ownership: `profile/` for the portrait, light/dark Home hero backgrounds, and favicon, `projects/<project-id>/` for project media, and `awards/`, `publications/`, and `patents/` for certificate files and publication project images under their owning record's `id` folder.
- `private/` contains ignored local-only contact material and raw originals. It is never part of the distributable package.

`Profile/` without `private/` is the complete public package. Do not create site-specific variants, aliases, overrides, or transformed authored copies. This directory provides data and media ownership only; it has no deployment, compilation, testing, or runtime support.
