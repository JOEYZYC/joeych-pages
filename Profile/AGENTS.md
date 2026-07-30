# PROFILE PACKAGE GUIDE

## OVERVIEW

- `Profile/data/` and `Profile/media/` are the sole authored public profile source. YAML and media bytes are framework-neutral.
- Keep workspace publication and verification policy in the root `AGENTS.md`.
- `Profile/private/` is ignored local material. Never enumerate it from synchronization or site code.
- Content claims must remain source-backed. Do not invent achievements, qualifications, metrics, links, or associations.

## WHERE TO LOOK

- `data/profile.yml`: public identity, contact data, shared copy, education, campus experience, and skills.
- `data/projects.yml`: project records, figures, tags, claims, contributions, and external links.
- `data/awards.yml`: competition awards, prize levels, and certificate associations.
- `data/publications.yml`: publication records, venues, author positions, and certificate associations.
- `data/patents.yml`: patent records, author positions, and certificate associations.
- `data/thesis.yml`: the single graduation-thesis record.
- `media/`: published portraits, icons, and certificate files at their literal site-relative hierarchy.
- Jekyll receives ignored byte-equivalent mirrors through `node tools/profile-sync.mjs --write`.

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
- New certificate files are not visible until an owning YAML record associates them. Project figures are placeholder-only; adding image sources requires coordinated schema, template, and test changes.

## ANTI-PATTERNS

- Do not change a schema, field name, nullability, record form, ID, or ordering casually.
- Do not duplicate YAML facts or media into Jekyll/Astro variants, overrides, aliases, or authored mirrors.
- Do not add a certificate-folder guide or place content policy beside certificate assets.
- Do not traverse, synchronize, test against, or publish `Profile/private/`.
- Do not add presentation, layout, style, or interaction rules here.
- Do not add an asset path without its YAML association, or a certificate reference to a missing asset.
- Do not change schemas without updating every Liquid and test consumer.

## VERIFICATION

- Parse edited YAML, run `node tools/profile-sync.mjs --write`, then require `node tools/profile-sync.mjs --check` to pass.
- For projects, confirm the exact record count, unique IDs, localized fields, figures, and links expected by `projects.spec.js`.
- For awards, publications, patents, and thesis, confirm required paired values and certificate paths against `awards.spec.js`.
- Inspect the consuming Liquid when adding fields or changing content ownership; schema changes require every consumer to change together.
- Recheck source-backed claims against the supplied record or evidence before publishing.
