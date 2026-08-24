---
description: Verify and push existing main-branch commits through the guarded Pages deployment script.
agent: build
---

Run the existing deployment script from the repository root:

```powershell
pwsh -NoProfile -File .\TOOLS\Push-AstroDeployment.ps1
```

Do not create commits, stage files, bypass checks, or reproduce the script logic. If the script rejects the deployment, report its exact reason. If it succeeds, report the GitHub Actions and Pages URLs printed by the script.
