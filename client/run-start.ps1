$shortClient = & (Join-Path $PSScriptRoot "ensure-windows-path.ps1")
Write-Host "Metro from: $shortClient" -ForegroundColor Cyan
Set-Location $shortClient
npx expo start --dev-client --clear @args
