# Builds a shareable APK for phone install.
# On Windows, Desktop paths are too long for CMake/ninja (reanimated), so this
# syncs to C:\cw\client and builds there - same short-path strategy as run-android.ps1.
#
# Usage:
#   npm run android:apk           # release APK (arm64)
#   npm run android:apk -- -Debug # debug APK

param(
  [switch]$Debug
)

$ErrorActionPreference = "Stop"

$desktopClient = $PSScriptRoot
$cwClient = "C:\cw\client"
$cwRoot = "C:\cw"
$desktopRoot = (Resolve-Path (Join-Path $desktopClient "..")).Path
$drive = "W:"

function Ensure-WDriveMapped([string]$targetRoot) {
  $substList = subst 2>$null
  $mapped = $substList | Select-String "^$drive"
  if (-not $mapped) {
    Write-Host "Remapping $drive -> $targetRoot" -ForegroundColor Yellow
    subst $drive $targetRoot | Out-Null
  } elseif ($mapped -notmatch [regex]::Escape($targetRoot)) {
    Write-Host "Remapping $drive -> $targetRoot (was mapped elsewhere)" -ForegroundColor Yellow
    subst "$drive" /D | Out-Null
    subst $drive $targetRoot | Out-Null
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

# Keep C:\cw in sync when launching from the Desktop tree.
if (
  ($desktopRoot -ne $cwRoot) -and
  ($desktopClient -notlike "C:\cw\*") -and
  ($desktopClient -notlike "W:\*")
) {
  Write-Host "Syncing Desktop -> C:\cw before APK build..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Path $cwRoot -Force | Out-Null
  $null = robocopy $desktopRoot $cwRoot /E /XD node_modules .cxx build .expo dist .git /NFL /NDL /NP /R:1 /W:1
  if ($LASTEXITCODE -ge 8) {
    throw "robocopy Desktop -> C:\cw failed with exit $LASTEXITCODE"
  }
}

$clientDir = & (Join-Path $PSScriptRoot "ensure-windows-path.ps1")
if ($clientDir -like "W:\*") {
  if (Test-Path $cwClient) {
    $clientDir = $cwClient
  } else {
    $clientDir = (Resolve-Path $clientDir).Path
  }
}

# Prefer real short path for Gradle (avoid mixed W:/C: roots).
if (Test-Path (Join-Path $cwClient "package.json")) {
  $clientDir = $cwClient
}

Write-Host "Building APK from: $clientDir" -ForegroundColor Cyan

# Unmap W: during Gradle so paths don't mix subst + real C: roots.
$substList = subst 2>$null
$wWasMapped = [bool]($substList | Select-String "^$drive")
if ($wWasMapped) {
  Write-Host "Temporarily unmapping $drive for Gradle..." -ForegroundColor Yellow
  subst "$drive" /D | Out-Null
}

try {
  Set-Location $clientDir

  # Bake EXPO_PUBLIC_* into the release JS bundle and derive OAuth schemes.
  Import-DotEnv (Join-Path $clientDir ".env")
  Import-DotEnv (Join-Path $clientDir ".env.local")

  # @citations/shared ships from dist/ (gitignored). Rebuild so defaults like
  # DEFAULT_WIDGET_DESIGN = sanctuary are what the JS bundle actually embeds.
  Write-Host "Building @citations/shared..." -ForegroundColor Cyan
  Push-Location (Join-Path $clientDir "..\shared")
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "shared build failed with exit $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }

  # Regenerate android/ from app.json before every build. Without this, a
  # stale android/ (e.g. from before a widget was removed from app.json)
  # never re-runs withAndroidWidgetResize's orphan-provider cleanup, so
  # retired widgets (like the old 2x2) keep getting compiled into "new" APKs.
  Write-Host "Running expo prebuild to sync android/ with app.json..." -ForegroundColor Cyan
  npx expo prebuild --clean -p android
  if ($LASTEXITCODE -ne 0) {
    throw "expo prebuild failed with exit $LASTEXITCODE"
  }

  $googleScheme = Get-GoogleReversedScheme $env:EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  if (-not $googleScheme) {
    Write-Host "WARNING: EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID unset/invalid - Google login redirect will fail on device." -ForegroundColor Yellow
  } else {
    Ensure-GoogleOAuthManifestScheme (Join-Path $clientDir "android\app\src\main\AndroidManifest.xml") $googleScheme
  }

  if (-not $env:EXPO_PUBLIC_GOOGLE_CLIENT_ID) {
    Write-Host "WARNING: EXPO_PUBLIC_GOOGLE_CLIENT_ID unset - Google button may be disabled or misconfigured." -ForegroundColor Yellow
  }

  # Belt-and-suspenders: prebuild above already copies fonts via config plugins,
  # but re-assert WidgetGlyphs in case that step's font-family collision logic
  # (see widget-layout.ts) ever loses the race with the full MaterialIcons copy.
  $widgetGlyphSrc = Join-Path $clientDir "assets\fonts\widget-glyphs\WidgetGlyphs.ttf"
  $androidFontsDir = Join-Path $clientDir "android\app\src\main\assets\fonts"
  if (Test-Path $widgetGlyphSrc) {
    New-Item -ItemType Directory -Path $androidFontsDir -Force | Out-Null
    Copy-Item $widgetGlyphSrc (Join-Path $androidFontsDir "WidgetGlyphs.ttf") -Force
    Remove-Item (Join-Path $androidFontsDir "MaterialIcons.ttf") -Force -ErrorAction SilentlyContinue
  }

  $env:NODE_ENV = "production"
  $env:CITATIONS_APK_BUILD = "1"
  $task = if ($Debug) { "assembleDebug" } else { "assembleRelease" }

  # Stale CMake/ninja trees under long paths break subsequent short-path builds.
  Remove-Item -Recurse -Force @(
    "android\app\.cxx",
    "android\app\build",
    "android\build",
    "node_modules\react-native-reanimated\android\.cxx",
    "node_modules\react-native-worklets\android\.cxx"
  ) -ErrorAction SilentlyContinue

  if (-not (Test-Path (Join-Path $clientDir "node_modules"))) {
    Write-Host "node_modules missing in $clientDir - run npm install there first." -ForegroundColor Red
    throw "Missing node_modules in APK build directory"
  }

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
  if ($wWasMapped -and (Test-Path $cwRoot)) {
    Ensure-WDriveMapped $cwRoot
  }
}
