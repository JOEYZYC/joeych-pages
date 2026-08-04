# Portfolio Workspace

This repository is one Git control plane for three ordinary directories:

| Directory | Ownership |
| --- | --- |
| [`Profile/`](Profile/README.md) | Shared public profile data and media. `Profile/private/` is ignored local-only material. |
| [`Jeklly/`](Jeklly/README.md) | Non-runnable, non-deployed Jekyll source archive. |
| [`Astro/`](Astro/README.md) | Separately approved static implementation consuming public `Profile/` sources. `Astro/Demo/` and `Astro/research/` are ignored local-only material. |

GitHub Pages remains disabled. Root `.gitignore` and `AGENTS.md` define the publication firewall; there is exactly one `.git` directory at the repository root.
