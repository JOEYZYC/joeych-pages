---
description: Build and start the project-local Astro production preview.
agent: build
---

Run the existing preview script from the repository root:

```powershell
pwsh -NoProfile -File .\TOOLS\Start-AstroPreview.ps1
```

Do not commit, push, deploy, or replace the script logic. Report the local preview URL printed by the script. Keep the preview attached until the user stops it with Ctrl+C.
