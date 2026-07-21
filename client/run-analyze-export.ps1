$shortClient = & (Join-Path $PSScriptRoot "ensure-windows-path.ps1")
Write-Host "Export (Atlas) from: $shortClient" -ForegroundColor Cyan
Set-Location $shortClient
$env:EXPO_ATLAS = "true"
Write-Host "Exporting production bundles with Expo Atlas..." -ForegroundColor Green
npx expo export @args
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
$atlasFile = Join-Path $shortClient ".expo\atlas.jsonl"
if (-not (Test-Path $atlasFile)) {
  Write-Host "Expected Atlas file not found: $atlasFile" -ForegroundColor Red
  exit 1
}
Write-Host "Opening Expo Atlas: $atlasFile" -ForegroundColor Green
npx expo-atlas $atlasFile
