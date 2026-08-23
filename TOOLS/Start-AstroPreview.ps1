Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

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

    & pnpm run build

    Write-Host 'Astro production preview: http://127.0.0.1:4321/joeych-pages/'
    Write-Host 'Press Ctrl+C to stop the preview.'

    & pnpm run preview
}
finally {
    Pop-Location
}
