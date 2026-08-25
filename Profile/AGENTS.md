# PROFILE PACKAGE GUIDE

## Ownership

- `site/` owns shared shell and SEO facts.
- `home/` owns Home copy and media.
- `about/` owns the detailed About page.
- `projects/` owns Projects page copy, index order, projects, outcomes, and files.
- `tech-stack/` owns Tech Stack copy and skills.
- Every fact must remain source-backed and bilingual where required.

## Page Bundles

- Page metadata uses `page.overline`, `page.title`, and `page.summary` localized values.
- Profile media references are same-directory filenames only.
- Do not duplicate page titles or substantive page copy in Astro templates.
- `site.yml` contains only cross-page identity, role, contact, and favicon facts.
- `home.yml` contains only Home content.
- `about.yml` contains overview, facts, statistics, interests, goal, education, and campus experience.
- `tech-stack.yml` contains skill groups, components, and evidence.

## Project Bundles

- Preserve stable project IDs and `projects/index.yml` order.
- Project IDs use `YYYY-Type-PascalCaseName`, where `Type` is `Paper`, `Patent`, `Competition`, or `Project`.
- Directory name, index ID, YAML ID, skill evidence ID, and project anchor must agree.
- Projects require bilingual title, claim, category, summary, and contribution plus `awards`, `publications`, and `patents` arrays.
- Publications and the thesis are projects. Outcomes are embedded only in their owning project.
- Project files use same-directory filenames only. Reject traversal, encoded paths, cross-project references, missing files, and symlinks.
- Use `{ zh: 请补充, en: To be completed }` when detail is unavailable.

## Boundaries

- `Profile/private/` and retired `Profile/profile/` must not exist; Astro refuses to build if either is recreated.
- Do not recreate `data/`, `media/`, separate outcome registries, aliases, or generated mirrors.
- YAML and Markdown are intentionally public because Astro serves the whole Profile directory.
