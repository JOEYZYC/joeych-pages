# SPLIT WORKSPACE GUIDE

## Scope

This repository is one Git control plane for three ordinary directories:

- `Profile/` owns the future shared public content and media package.
- `Jeklly/` owns the existing Jekyll site as an offline archive.
- `Astro/` is a placeholder for a separately approved future implementation.

The Jekyll archive is not deployed. GitHub Pages must remain disabled, and no deployment workflow, executable deployment path, or broad-staging command may be introduced.

## Publication Firewall

- Keep `Profile/private/` local-only. Never stage or publish it.
- Keep `Astro/research/` local-only. Never stage or publish it.
- Treat `Jeklly/_data/`, `Jeklly/assets/img/`, and `Jeklly/.generated/` as ignored generated mirrors, not authored sources.
- Keep `Jeklly/archive/local/` and `.tmp-build/` local-only.
- Preserve root tooling and maintenance ignores, including `.omo/`, `.playwright-mcp/`, `.codegraph/`, `node_modules/`, and source originals.
- Public `Profile/data/`, `Profile/media/`, `Profile/README.md`, and `Astro/README.md` must remain trackable.

## Repository Boundaries

- Maintain exactly one `.git` directory at the repository root.
- Do not create nested repositories, submodules, or gitlinks.
- Do not move profile data, media, Jekyll source, research, screenshots, or raw originals as part of root-contract work.
- Do not initialize Astro or add Astro packages, source, configuration, or workflows without a separate approved plan.
- Stage explicit paths only. Never use `git add -A`, `git add .`, or repository-wide wildcards.

## Current Transition

The split directory and ignore contracts are established before later relocation tasks. Detailed Jekyll documentation remains with the archive relocation/documentation work and must not be invented at the root.
