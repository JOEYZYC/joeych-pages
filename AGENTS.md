# SPLIT WORKSPACE GUIDE

## Scope

This repository is one Git control plane for three ordinary directories:

- `Profile/` owns the future shared public content and media package.
- `Jeklly/` owns the existing Jekyll site as an offline archive.
- `Astro/` owns the separately approved static implementation.

The Jekyll archive is not deployed. GitHub Pages is permitted only through the exception below.

## GitHub Pages Exception

The sole authorized publication path is the root-owned `.github/workflows/deploy-pages.yml` workflow. It may build from `Astro/`, consume only public `Profile/` sources, upload only `Astro/dist`, and deploy that artifact to GitHub Pages through Actions.

- Do not publish Jekyll or repository-root content.
- Do not use a `gh-pages` branch, `CNAME`, custom domain, additional deployment workflow, deployment script, or hosting provider.
- Do not upload broad artifacts, stage broadly, or force-push.

## Publication Firewall

- Keep `Profile/private/` local-only. Never stage or publish it.
- Keep `Astro/Demo/` and `Astro/research/` local-only. Never stage, import, build, or publish them.
- Treat `Jeklly/_data/`, `Jeklly/assets/img/`, and `Jeklly/.generated/` as ignored generated mirrors, not authored sources.
- Keep `Jeklly/archive/local/` and `.tmp-build/` local-only.
- Preserve root tooling and maintenance ignores, including `.omo/`, `.playwright-mcp/`, `.codegraph/`, `node_modules/`, and source originals.
- Public `Profile/data/`, `Profile/media/`, `Profile/README.md`, and `Astro/README.md` must remain trackable.

## Repository Boundaries

- Maintain exactly one `.git` directory at the repository root.
- Do not create nested repositories, submodules, or gitlinks.
- Do not move profile data, media, Jekyll source, research, screenshots, or raw originals as part of root-contract work.
- Keep Astro implementation changes within separately approved work. The root-owned workflow in the GitHub Pages Exception is the only deployment exception.
- Stage explicit paths only. Never use broad staging or repository-wide wildcards.

## Current Transition

The Astro static implementation is separately approved and consumes only public `Profile/` sources. The GitHub Pages Exception does not weaken the publication firewall, explicit-staging, or single-root-`.git` contracts. Detailed Jekyll documentation remains with the archive relocation/documentation work and must not be invented at the root.
