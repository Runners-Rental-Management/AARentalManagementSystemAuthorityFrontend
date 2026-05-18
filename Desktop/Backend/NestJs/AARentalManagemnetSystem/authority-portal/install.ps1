# Run from authority-portal folder: .\install.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Trying npm install (project .npmrc: strict-ssl=false)..." -ForegroundColor Cyan
npm install --prefer-offline
if ($LASTEXITCODE -eq 0) { exit 0 }

Write-Host "Retry with NODE_OPTIONS=--use-system-ca ..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--use-system-ca"
npm install
if ($LASTEXITCODE -eq 0) { exit 0 }

Write-Host "If install still fails: close IDE/antivirus locks on node_modules, try another network or hotspot, then run: npm install" -ForegroundColor Yellow
exit $LASTEXITCODE
