# PROFILE PACKAGE GUIDE

## OVERVIEW

- `Profile/data/` and `Profile/media/` are the sole authored public profile source. YAML and media bytes are framework-neutral.
- Keep workspace publication and verification policy in the root `AGENTS.md`.
- `Profile/private/` is ignored local material. Never enumerate it from archived or future site code.
- Content claims must remain source-backed. Do not invent achievements, qualifications, metrics, links, or associations.

## WHERE TO LOOK

- `data/profile.yml`: public identity, contact data, shared copy, education, campus experience, and skills.
- `data/projects.yml`: project records, figures, tags, claims, contributions, and external links.
- `data/awards.yml`: competition awards, prize levels, and certificate associations.
- `data/publications.yml`: publication records, venues, author positions, and certificate associations.
- `data/patents.yml`: patent records, author positions, and certificate associations.
- `data/thesis.yml`: the single graduation-thesis record.
- `media/`: published portraits, icons, and certificate files at their literal site-relative hierarchy.
- Ignored Jekyll mirrors are not authored sources and do not change Profile ownership.

## CONVENTIONS

- Add or revise authored content in its owning YAML file, not in a template.
- Bilingual values generally use `{ zh, en }`. Supply both non-empty strings where the schema expects localized copy.
- Preserve each record's stable `id`. Project IDs are HTML anchors.
- Preserve project ordering. `tech-stack.html` links to projects by fixed array position and ID.
- Keep list records in their existing field shape: IDs, years, featured flags, localized titles, tags, links, and record-specific fields.
- Projects require localized `title`, `claim`, `category`, and `summary`; `contribution` may be `null`.
- Project figures require stable `id` plus `zh` and `en`; project links require `type`, `url`, and localized `label`.
- Award records use `prizes` with `level`, `zh`, and `en`.
- Publication records include localized `venue` and `authors`; patent records include localized `authors`.
- The thesis is a mapping, not a list. Keep its `id`, year, localized `title` and `award`, tags, and links shape.
- Certificate entries are literal `{ src, zh, en }` values. Keep `src` under `assets/img/certificates`; the matching authored file lives under `Profile/media/certificates`.
- New certificate files are not visible until an owning YAML record associates them. Project figures are placeholder-only; adding image sources requires coordinated schema and template review.

## ANTI-PATTERNS

- Do not change a schema, field name, nullability, record form, ID, or ordering casually.
- Do not duplicate YAML facts or media into Jekyll/Astro variants, overrides, aliases, or authored mirrors.
- Do not add a certificate-folder guide or place content policy beside certificate assets.
- Do not traverse, copy, or publish `Profile/private/`.
- Do not add presentation, layout, style, or interaction rules here.
- Do not add an asset path without its YAML association, or a certificate reference to a missing asset.
- Do not change schemas without accounting for every archived Liquid consumer.

## ARCHIVE OWNERSHIP NOTES

- Preserve source-backed claims, stable record shapes, localized values, and literal certificate associations.
- Treat `Profile/data/` and `Profile/media/` as the only authored public sources; ignored mirrors and local private material are outside the distributable package.
- This archive guide provides ownership and data-shape context only; it has no executable workflow.
