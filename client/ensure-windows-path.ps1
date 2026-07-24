# Maps W: to the repo root so Node/Metro/Gradle all see short paths on Windows.

param(
  [string]$ClientDir = $PSScriptRoot
)

$repoRoot = (Resolve-Path (Join-Path $ClientDir "..")).Path
$drive = "W:"
$shortClient = "$drive\client"

if ($env:OS -notlike "*Windows*") {
  return $ClientDir
}

$substList = subst 2>$null
$mapped = $substList | Select-String "^$drive"

if (-not $mapped) {
  Write-Host "Mapping $drive -> $repoRoot" -ForegroundColor Yellow
  subst $drive $repoRoot | Out-Null
} elseif ($mapped -notmatch [regex]::Escape($repoRoot)) {
  Write-Host "WARNING: $drive is mapped elsewhere. Run: subst $drive /D" -ForegroundColor Red
}

if (Test-Path $shortClient) {
  return $shortClient
}

return $ClientDir
