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
- `media/`: published portraits, icons, project figures, and certificate files, organized to mirror the `data/` record ownership (see CONVENTIONS).
- Ignored Jekyll mirrors are not authored sources and do not change Profile ownership.

## CONVENTIONS

- Add or revise authored content in its owning YAML file, not in a template.
- Bilingual values generally use `{ zh, en }`. Supply both non-empty strings where the schema expects localized copy.
- `profile.yml` requires a `portrait` path relative to `Profile/media/`; it associates the public identity portrait without prescribing its presentation.
- `profile.yml` requires a `favicon` path relative to `Profile/media/`; it associates the public site icon without prescribing its presentation.
- Preserve each record's stable `id`. Project IDs are HTML anchors.
- Preserve project ordering. `tech-stack.html` links to projects by fixed array position and ID.
- Keep list records in their existing field shape: IDs, years, featured flags, localized titles, tags, links, and record-specific fields.
- Projects require localized `title`, `claim`, `category`, and `summary`; `contribution` may be `null`.
- Project `image` may be `null` or a path relative to `Profile/media/`. Figures require stable `id` plus `zh` and `en`, and may include an optional `src` path relative to `Profile/media/`; project links require `type`, `url`, and localized `label`.
- Award records use `prizes` with `level`, `zh`, and `en`.
- Publication records include localized `venue` and `authors`; patent records include localized `authors`.
- The thesis is a mapping, not a list. Keep its `id`, year, localized `title` and `award`, tags, and links shape.
- Certificate entries are literal `{ src, zh, en }` values. `src` is a path relative to `Profile/media/`, placed under the owning record's folder by kind: `awards/<award-id>/…`, `publications/<publication-id>/…`, or `patents/<patent-id>/…`. Profile media lives under `media/profile/`, project media under `media/projects/<project-id>/`, and the shared placeholder stays at `media/projects/project-placeholder.png`.
- New certificate files are not visible until an owning YAML record associates them. A project image should match its first sourced figure when figures provide `src`.

## SKILL EVIDENCE SCHEMA

- Each `skills[].tags[]` entry requires stable `id`, scalar `zh`, scalar `en`, non-empty `components`, and non-empty `evidence`. There are no optional tag fields in the current schema.
- Each component is a mapping with a stable `id`. Every component ID must appear in at least one evidence entry's `supports` list.
- Evidence `type` is one of `project`, `credential`, or `general-ability`. A `credential` uses `verification: public-profile-claim`; a `general-ability` uses `verification: self-described` and `level: working` or `exposure`.
- Project evidence requires an existing stable `project_id`, `scope: project-record`, and supported component IDs. It shows that the technology appears in that project record, not that the profile owner was its sole contributor or owner.
- The hardcoded Jekyll learning map is a learning taxonomy, not evidence for professional skill tags. Do not map its 47 items into this schema.
- Archived Liquid reads only `tag.zh` and `tag.en`; it ignores evidence and other extra tag keys. Preserve those displayed scalar values and tag order for compatibility.

## ANTI-PATTERNS

- Do not change a schema, field name, nullability, record form, ID, or ordering casually.
- Do not duplicate YAML facts or media into Jekyll/Astro variants, overrides, aliases, or authored mirrors.
- Do not add a certificate-folder guide or place content policy beside certificate assets.
- Do not traverse, copy, or publish `Profile/private/`.
- Do not add presentation, layout, style, or interaction rules here.
- Do not add an asset path without its YAML association, a project image or figure `src` that does not resolve under `Profile/media/`, or a certificate reference to a missing asset.
- Do not change schemas without accounting for every archived Liquid consumer. Archived Jekyll may ignore figure `src` and remains unchanged.

## ARCHIVE OWNERSHIP NOTES

- Preserve source-backed claims, stable record shapes, localized values, and literal certificate associations.
- Treat `Profile/data/` and `Profile/media/` as the only authored public sources; ignored mirrors and local private material are outside the distributable package.
- This archive guide provides ownership and data-shape context only; it has no executable workflow.
