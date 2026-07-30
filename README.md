# Portfolio Workspace

This repository is the control plane for a split portfolio workspace. It contains one root Git repository and three ordinary workspace directories:

| Directory | Contract |
| --- | --- |
| `Profile/` | Reserved for the shared, portable public profile package. `Profile/private/` is local-only and ignored. |
| `Jeklly/` | Reserved for the existing Jekyll site as an offline, locally usable archive. It is not deployed. |
| `Astro/` | Reserved for a future Astro implementation. Only its placeholder contract is tracked; research remains local-only. |

The directory contracts and publication firewall are established before content relocation. Detailed Jekyll documentation and path migration are handled separately.

## Publication Status

GitHub Pages is disabled. The Jekyll site is archive-only, and this repository must not add or run a deployment workflow without separate explicit approval.

## Root Control Plane

Root files govern repository-wide ownership and safety:

- `.gitignore` defines private, research, generated-mirror, local-archive, and build-output boundaries.
- `AGENTS.md` defines workspace-wide editing rules.
- `.github/`, `.omo/`, and `.playwright-mcp/` remain root maintenance state.
- `LICENSE` remains the repository license.

There must be exactly one `.git` directory, at the repository root. Do not initialize nested repositories or add Git submodules/gitlinks.
