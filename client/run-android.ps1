$shortClient = & (Join-Path $PSScriptRoot "ensure-windows-path.ps1")
Write-Host "Building from: $shortClient" -ForegroundColor Cyan
Set-Location $shortClient

Remove-Item -Recurse -Force "android\app\.cxx", "android\app\build", "android\build" -ErrorAction SilentlyContinue
npx expo run:android @args
