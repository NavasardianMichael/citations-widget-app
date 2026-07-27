# Resolves a short Windows path for Metro/Gradle.
# Prefers C:\cw (real short copy) over subst W: → Desktop, because subst causes
# "different roots" Gradle failures when some paths realpath to C:\Users\...Desktop.

param(
  [string]$ClientDir = $PSScriptRoot
)

$repoRoot = (Resolve-Path (Join-Path $ClientDir "..")).Path
$cwRoot = "C:\cw"
$cwClient = Join-Path $cwRoot "client"
$drive = "W:"
$shortClient = "$drive\client"

if ($env:OS -notlike "*Windows*") {
  return $ClientDir
}

# Repo root is already short enough for Gradle/Metro — no subst or C:\cw copy needed.
if ($repoRoot.Length -le 50) {
  return $ClientDir
}

# Best option: real short path copy (no subst mixed roots).
if (Test-Path (Join-Path $cwClient "package.json")) {
  # Point W: at C:\cw so any leftover W:\client references hit the same tree.
  $substList = subst 2>$null
  $mapped = $substList | Select-String "^$drive"
  if (-not $mapped) {
    Write-Host "Mapping $drive -> $cwRoot" -ForegroundColor Yellow
    subst $drive $cwRoot | Out-Null
  } elseif ($mapped -notmatch [regex]::Escape($cwRoot)) {
    Write-Host "Remapping $drive -> $cwRoot (was mapped elsewhere)" -ForegroundColor Yellow
    subst "$drive" /D | Out-Null
    subst $drive $cwRoot | Out-Null
  }
  return $cwClient
}

# Fallback: subst W: onto the current repo (Desktop long path).
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
