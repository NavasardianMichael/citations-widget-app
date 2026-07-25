$ErrorActionPreference = "Stop"

$desktopClient = $PSScriptRoot
$cwClient = "C:\cw\client"
$cwRoot = "C:\cw"
$desktopRoot = (Resolve-Path (Join-Path $desktopClient "..")).Path

# Keep C:\cw in sync when launching from the Desktop tree (separate copy until symlink).
if (
  (Test-Path (Join-Path $cwClient "package.json")) -and
  ($desktopRoot -ne $cwRoot) -and
  ($desktopClient -notlike "C:\cw\*") -and
  ($desktopClient -notlike "W:\*")
) {
  Write-Host "Syncing Desktop -> C:\cw before Android build..." -ForegroundColor Yellow
  $null = robocopy $desktopRoot $cwRoot /E /XD node_modules .cxx build .expo dist .git /NFL /NDL /NP /R:1 /W:1
  if ($LASTEXITCODE -ge 8) {
    throw "robocopy Desktop -> C:\cw failed with exit $LASTEXITCODE"
  }
}

$shortClient = & (Join-Path $PSScriptRoot "ensure-windows-path.ps1")
Write-Host "Building from: $shortClient" -ForegroundColor Cyan

# Always build from the real short path (C:\cw\client), never W:\ — Gradle codegen
# fails with "different roots" when W: and C:\ paths are mixed.
if ($shortClient -like "W:\*") {
  if (Test-Path $cwClient) {
    $shortClient = $cwClient
    Write-Host "Using real path instead of subst: $shortClient" -ForegroundColor Yellow
  } else {
    # Last resort: unmap W: and use resolved real path
    $resolved = (Resolve-Path $shortClient).Path
    subst W: /D 2>$null | Out-Null
    $shortClient = $resolved
    Write-Host "Unmapped W:; building from: $shortClient" -ForegroundColor Yellow
  }
}

Set-Location $shortClient

Remove-Item -Recurse -Force "android\app\.cxx", "android\app\build", "android\build" -ErrorAction SilentlyContinue
npx expo run:android @args
