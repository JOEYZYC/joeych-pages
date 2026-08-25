# Portfolio Workspace

This repository is one Git control plane for three ordinary directories:

| Directory | Ownership |
| --- | --- |
| [`Profile/`](Profile/README.md) | Fully public, framework-neutral profile bundles with colocated YAML and media. |
| [`Jeklly/`](Jeklly/README.md) | Non-runnable, non-deployed Jekyll source archive. |
| [`Astro/`](Astro/README.md) | Separately approved static implementation consuming public `Profile/` sources. `Astro/Demo/` and `Astro/research/` are ignored local-only material. |

The completed Astro site is published at https://joeyzyc.github.io/joeych-pages/ only through the audited root workflow `.github/workflows/deploy-pages.yml`. It builds `Astro/`, consumes public `Profile/` sources, and deploys only `Astro/dist`; root `.gitignore` and `AGENTS.md` preserve the publication firewall, and there is exactly one `.git` directory at the repository root.
