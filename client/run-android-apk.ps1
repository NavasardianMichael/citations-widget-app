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

function Import-DotEnv([string]$path) {
  if (-not (Test-Path $path)) { return }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }
    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    Set-Item -Path "Env:$name" -Value $value
  }
}

function Get-GoogleReversedScheme([string]$clientId) {
  if (-not $clientId) { return $null }
  $trimmed = $clientId.Trim()
  if (-not $trimmed.EndsWith(".apps.googleusercontent.com")) { return $null }
  $guid = $trimmed.Substring(0, $trimmed.Length - ".apps.googleusercontent.com".Length)
  return "com.googleusercontent.apps.$guid"
}

function Ensure-GoogleOAuthManifestScheme([string]$manifestPath, [string]$scheme) {
  if (-not $scheme) { return }
  if (-not (Test-Path $manifestPath)) {
    throw "AndroidManifest not found: $manifestPath"
  }

  $xml = Get-Content -Raw $manifestPath
  if ($xml -match [regex]::Escape("android:scheme=`"$scheme`"")) {
    Write-Host "Google OAuth scheme already in AndroidManifest." -ForegroundColor DarkGray
    return
  }

  $marker = '<data android:scheme="exp+citations-widget-app"/>'
  if (-not $xml.Contains($marker)) {
    throw "Could not find deep-link intent-filter marker in AndroidManifest to inject Google OAuth scheme."
  }

  $dataLine = "        <data android:scheme=`"$scheme`"/>"
  # Insert after every exp+ scheme entry (main + generated intent-filters).
  $updated = $xml.Replace($marker, "$marker`r`n$dataLine")
  Set-Content -Path $manifestPath -Value $updated -NoNewline
  Write-Host "Injected Google OAuth scheme into AndroidManifest." -ForegroundColor Green
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

  # Bake EXPO_PUBLIC_* into the release JS bundle and derive OAuth schemes.
  Import-DotEnv (Join-Path $clientDir ".env")
  Import-DotEnv (Join-Path $clientDir ".env.local")

  $googleScheme = Get-GoogleReversedScheme $env:EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  if (-not $googleScheme) {
    Write-Host "WARNING: EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID unset/invalid — Google login redirect will fail on device." -ForegroundColor Yellow
  } else {
    Ensure-GoogleOAuthManifestScheme (Join-Path $clientDir "android\app\src\main\AndroidManifest.xml") $googleScheme
  }

  if (-not $env:EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
    Write-Host "WARNING: EXPO_PUBLIC_GOOGLE_CLIENT_ID unset — Google button may be disabled or misconfigured." -ForegroundColor Yellow
  }

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
  Write-Host ""
  Write-Host "Google login: Android OAuth client must use package com.anonymous.citationswidgetapp" -ForegroundColor Cyan
  Write-Host "and SHA-1 of android/app/debug.keystore (release currently signs with that key)." -ForegroundColor Cyan
}
finally {
  Remove-Item Env:CITATIONS_APK_BUILD -ErrorAction SilentlyContinue
  if ($wWasMappedHere) {
    Ensure-WDriveMapped
  }
}
