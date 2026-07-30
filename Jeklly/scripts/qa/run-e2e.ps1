$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$evidenceRoot = '.omo/evidence/portfolio-editorial-redesign/task-13'
New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null
$stdout = Join-Path $evidenceRoot 'jekyll.stdout.log'
$stderr = Join-Path $evidenceRoot 'jekyll.stderr.log'
$npmStdout = Join-Path $evidenceRoot 'npm.stdout.log'
$npmStderr = Join-Path $evidenceRoot 'npm.stderr.log'
$runnerLog = Join-Path $evidenceRoot 'runner.log'
$npmTimeoutSeconds = 15 * 60
$cleanupTimeoutSeconds = 30
Remove-Item -LiteralPath @($stdout, $stderr, $npmStdout, $npmStderr, $runnerLog) -Force -ErrorAction SilentlyContinue

function Stop-ProcessTree {
  param([object]$Process, [int]$WaitTimeoutSeconds)
  if ($null -eq $Process) {
    return
  }

  $processId = [int]$Process.Id
  if ($IsWindows) {
    $null = Start-Process -FilePath 'taskkill.exe' -ArgumentList @('/PID',"$processId",'/T','/F') -PassThru -Wait -WindowStyle Hidden
  } else {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
  Wait-Process -Id $processId -Timeout $WaitTimeoutSeconds -ErrorAction SilentlyContinue
}

$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:8123/joeych-pages/'
$env:PW_CAPTURE_ROOT = '.omo/evidence/portfolio-editorial-redesign/final/screenshots'
$env:PW_MANIFEST = '.omo/evidence/portfolio-editorial-redesign/final/manifest.json'
$env:PW_REPORT_ROOT = '.omo/evidence/portfolio-editorial-redesign/final/playwright'

$jekyll = $null
$npm = $null
$npmWaited = $false

try {
  $jekyll = Start-Process -FilePath 'bundle' -ArgumentList @('exec','jekyll','serve','--host','127.0.0.1','--port','8123','--baseurl','/joeych-pages','--no-watch') -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  $ready = $false
  for ($attempt = 1; $attempt -le 60; $attempt += 1) {
    if ($jekyll.HasExited) {
      throw "Jekyll exited before readiness. See $stderr."
    }

    try {
      $response = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8123/joeych-pages/'
      if ($response.StatusCode -eq 200) {
        $ready = $true
        Add-Content -LiteralPath $runnerLog -Value "HTTP 200 readiness after $attempt attempt(s)."
        break
      }
    } catch [Microsoft.PowerShell.Commands.HttpResponseException] {
      if ($attempt -eq 60) {
        throw
      }
    } catch [System.Net.Http.HttpRequestException] {
      if ($attempt -eq 60) {
        throw
      }
    }

    Start-Sleep -Seconds 1
  }

  if (-not $ready) {
    throw 'Jekyll did not return HTTP 200 within 60 seconds.'
  }

  $npmExecutable = if ($IsWindows) { 'npm.cmd' } else { 'npm' }
  Add-Content -LiteralPath $runnerLog -Value "Starting npm run test:e2e -- --grep-invert baseline with a $npmTimeoutSeconds-second timeout."
  $npm = Start-Process -FilePath $npmExecutable -ArgumentList @('run','test:e2e','--','--grep-invert','baseline') -PassThru -RedirectStandardOutput $npmStdout -RedirectStandardError $npmStderr
  Wait-Process -Id $npm.Id -Timeout $npmTimeoutSeconds -ErrorAction SilentlyContinue
  $npmWaited = $npm.HasExited
  if (-not $npmWaited) {
    throw "Playwright exceeded the $npmTimeoutSeconds-second timeout."
  }
  if ($npm.ExitCode -ne 0) {
    throw "Playwright exited with code $($npm.ExitCode). See $npmStderr."
  }
} finally {
  try {
    if ($null -ne $npm) {
      Stop-ProcessTree -Process $npm -WaitTimeoutSeconds $cleanupTimeoutSeconds
      Add-Content -LiteralPath $runnerLog -Value "npm process $($npm.Id) cleanup complete."
    }
  } finally {
    if ($null -ne $jekyll) {
      Stop-ProcessTree -Process $jekyll -WaitTimeoutSeconds $cleanupTimeoutSeconds
      Add-Content -LiteralPath $runnerLog -Value "Jekyll process $($jekyll.Id) cleanup complete."
    }
  }
}
