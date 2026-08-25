# Portable Profile Package

`Profile/` is the complete public content package consumed directly by Astro. Its directories correspond to the site's content surfaces:

- `site/site.yml` owns shared name, role, contact links, and favicon.
- `home/home.yml` owns Home title, greeting, summary, portrait, backgrounds, and colocated Home media.
- `about/about.yml` owns the detailed About copy, facts, statistics, interests, goal, education, and campus experience.
- `projects/page.yml` owns Projects page copy; `projects/index.yml` owns order; `projects/<id>/project.yml` owns each project, embedded outcomes, and colocated files.
- `tech-stack/tech-stack.yml` owns Tech Stack page copy and skill evidence.

Page titles, summaries, and substantive copy belong in these YAML files. Navigation, controls, dialogs, and accessibility labels remain Astro UI copy.

The whole directory is public. `Profile/private/`, `Profile/profile/`, `data/`, and `media/` must not exist. Do not create mirrors or site-specific copies.
