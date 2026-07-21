# Builds a shareable APK for phone install.
# On Windows, Gradle must not mix subst drive W: with the real C: path — so this
# script temporarily unmaps W:, builds from the real client folder, then remaps.
#
# Usage:
#   npm run android:apk           # release APK (arm64)
#   npm run android:apk -- -Debug # debug APK

param(
  [switch]$Debug
)

$ErrorActionPreference = "Stop"
$clientDir = $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $clientDir "..")).Path
$drive = "W:"

function Ensure-WDriveMapped {
  $substList = subst 2>$null
  $mapped = $substList | Select-String "^$drive"
  if (-not $mapped) {
    Write-Host "Remapping $drive -> $repoRoot" -ForegroundColor Yellow
    subst $drive $repoRoot | Out-Null
  }
}

# Remember if W: pointed at this repo so we can restore after the build.
$substList = subst 2>$null
$wWasMappedHere = [bool]($substList | Select-String "^$drive" | Where-Object { $_ -match [regex]::Escape($repoRoot) })

if ($wWasMappedHere) {
  Write-Host "Temporarily unmapping $drive for Gradle (avoids mixed W:/C: roots)..." -ForegroundColor Yellow
  subst "$drive" /D | Out-Null
}

try {
  Write-Host "Building APK from: $clientDir" -ForegroundColor Cyan
  Set-Location $clientDir

  $env:NODE_ENV = "production"
  $env:CITATIONS_APK_BUILD = "1"
  $task = if ($Debug) { "assembleDebug" } else { "assembleRelease" }

  # Long paths under Desktop often break CMake/ninja ("build.ninja still dirty").
  Remove-Item -Recurse -Force @(
    "android\app\.cxx",
    "android\app\build",
    "android\build"
  ) -ErrorAction SilentlyContinue

  Set-Location (Join-Path $clientDir "android")
  # Most phones are arm64; single-ABI also reduces ninja path-length pain.
  & .\gradlew.bat $task "-PreactNativeArchitectures=arm64-v8a" "--max-workers=2" @args
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  $variant = if ($Debug) { "debug" } else { "release" }
  $apk = Join-Path $clientDir "android\app\build\outputs\apk\$variant\app-$variant.apk"
  Write-Host ""
  Write-Host "APK ready:" -ForegroundColor Green
  Write-Host "  $apk"
  Write-Host ""
  Write-Host "Install: adb install -r `"$apk`"" -ForegroundColor Cyan
}
finally {
  Remove-Item Env:CITATIONS_APK_BUILD -ErrorAction SilentlyContinue
  if ($wWasMappedHere) {
    Ensure-WDriveMapped
  }
}
