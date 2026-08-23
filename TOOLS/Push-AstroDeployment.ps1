Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$repoRoot = Split-Path -Parent $PSScriptRoot
$astroRoot = Join-Path $repoRoot 'Astro'
$expectedOrigin = 'https://github.com/JOEYZYC/joeych-pages.git'
$actionsUrl = 'https://github.com/JOEYZYC/joeych-pages/actions/workflows/deploy-pages.yml'
$pagesUrl = 'https://joeyzyc.github.io/joeych-pages/'
$forbiddenPathPatterns = @(
    '^Profile/private(?:/|$)',
    '^Astro/Demo(?:/|$)',
    '^Astro/research(?:/|$)',
    '^Astro/(?:node_modules|\.astro|dist|coverage|test-results|playwright-report)(?:/|$)',
    '^Jeklly/archive/local(?:/|$)',
    '^Jeklly/(?:_data|assets/img|\.generated)(?:/|$)',
    '^\.tmp-build(?:/|$)',
    '^\.(?:omo|playwright-mcp|codegraph)(?:/|$)',
    '(^|/)node_modules(?:/|$)',
    '^素材(?:/|$)',
    '(^|/)CNAME$',
    '^\.gitmodules$'
)

if (-not (Test-Path -LiteralPath $astroRoot -PathType Container)) {
    throw "Missing Astro directory: $astroRoot"
}

$null = Get-Command git -CommandType Application -ErrorAction Stop
$null = Get-Command pnpm -ErrorAction Stop

Push-Location -LiteralPath $repoRoot
try {
    $gitPrefix = (& git rev-parse --show-prefix).Trim()
    if ($gitPrefix.Length -ne 0) {
        throw "The TOOLS directory must be directly below the Git repository root; current Git prefix is '$gitPrefix'."
    }

    $statusLines = @(& git status --porcelain=v1 --untracked-files=all)
    if ($statusLines.Count -ne 0) {
        throw 'The working tree must be completely clean, including untracked files.'
    }

    $currentBranch = (& git branch --show-current).Trim()
    if ($currentBranch -cne 'main') {
        throw "The current branch must be 'main'; found '$currentBranch'."
    }

    $fetchUrls = @(& git remote get-url --all origin)
    $pushUrls = @(& git remote get-url --push --all origin)
    if ($fetchUrls.Count -ne 1 -or $fetchUrls[0].Trim() -cne $expectedOrigin) {
        throw "The origin fetch URL must be exactly '$expectedOrigin'."
    }
    if ($pushUrls.Count -ne 1 -or $pushUrls[0].Trim() -cne $expectedOrigin) {
        throw "The origin push URL must be exactly '$expectedOrigin'."
    }

    & git fetch --no-tags origin refs/heads/main:refs/remotes/origin/main

    $countText = (& git rev-list --left-right --count origin/main...HEAD).Trim()
    $countParts = $countText -split '\s+'
    if ($countParts.Count -ne 2) {
        throw "Unexpected rev-list count output: '$countText'."
    }

    $behindCount = 0L
    $aheadCount = 0L
    if (-not [long]::TryParse($countParts[0], [ref]$behindCount) -or -not [long]::TryParse($countParts[1], [ref]$aheadCount)) {
        throw "Unable to parse rev-list count output: '$countText'."
    }
    if ($behindCount -gt 0 -and $aheadCount -gt 0) {
        throw "Local main and origin/main have diverged ($aheadCount ahead, $behindCount behind)."
    }
    if ($behindCount -gt 0) {
        throw "Local main is behind origin/main by $behindCount commit(s)."
    }
    if ($aheadCount -eq 0) {
        throw 'Local main has no outgoing commits to deploy.'
    }

    $outgoingCommits = @(& git rev-list origin/main..HEAD)
    if ($outgoingCommits.Count -eq 0) {
        throw 'No outgoing commits were found after the ahead/behind check.'
    }

    $hasWorkflowTriggerPath = $false
    foreach ($commit in $outgoingCommits) {
        $commitHash = $commit.Trim()
        $changedPaths = @(& git diff-tree --root -m --format= --no-commit-id --name-only -r --no-renames $commitHash)

        foreach ($changedPath in $changedPaths) {
            $path = $changedPath.Trim().Replace('\', '/')
            foreach ($forbiddenPattern in $forbiddenPathPatterns) {
                if ($path -imatch $forbiddenPattern) {
                    throw "Outgoing commit '$commitHash' contains forbidden path '$path'."
                }
            }

            if (($path -imatch '^Astro/' -and
                    $path -inotmatch '^Astro/Demo(?:/|$)' -and
                    $path -inotmatch '^Astro/research(?:/|$)') -or
                $path -imatch '^Profile/data/' -or
                $path -imatch '^Profile/media/' -or
                $path -ceq '.github/workflows/deploy-pages.yml') {
                $hasWorkflowTriggerPath = $true
            }
        }
    }

    if (-not $hasWorkflowTriggerPath) {
        throw 'Outgoing commits do not contain a path that triggers the Pages workflow.'
    }

    Set-Location -LiteralPath $astroRoot

    & pnpm install --frozen-lockfile

    & pnpm run verify

    Set-Location -LiteralPath $repoRoot

    & git push origin main

    Write-Host "GitHub Actions: $actionsUrl"
    Write-Host "GitHub Pages: $pagesUrl"
}
finally {
    Pop-Location
}
