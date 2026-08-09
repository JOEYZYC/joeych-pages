Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$astroRoot = Join-Path $repoRoot 'Astro'
$packageJson = Join-Path $astroRoot 'package.json'
$lockfile = Join-Path $astroRoot 'pnpm-lock.yaml'

if (-not (Test-Path -LiteralPath $packageJson -PathType Leaf)) {
    throw "Missing Astro package manifest: $packageJson"
}

if (-not (Test-Path -LiteralPath $lockfile -PathType Leaf)) {
    throw "Missing Astro lockfile: $lockfile"
}

$null = Get-Command pnpm -ErrorAction Stop

Push-Location -LiteralPath $astroRoot
try {
    & pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        throw "Frozen pnpm install failed (exit code $LASTEXITCODE)."
    }

    & pnpm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Astro production build failed (exit code $LASTEXITCODE)."
    }

    Write-Host 'Astro production preview: http://127.0.0.1:4321/joeych-pages/'
    Write-Host 'Press Ctrl+C to stop the preview.'

    & pnpm run preview
    if ($LASTEXITCODE -ne 0) {
        throw "Astro preview failed (exit code $LASTEXITCODE)."
    }
}
finally {
    Pop-Location
}
