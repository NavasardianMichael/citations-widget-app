$shortClient = & (Join-Path $PSScriptRoot "ensure-windows-path.ps1")
Write-Host "Metro (Atlas) from: $shortClient" -ForegroundColor Cyan
Set-Location $shortClient
$env:EXPO_ATLAS = "true"
Write-Host "EXPO_ATLAS=true - open Atlas via Shift+M or http://localhost:8081/_expo/atlas" -ForegroundColor Green
npx expo start --dev-client --no-dev @args
