# Hostinger Node.js setup helper
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host ""
Write-Host "=== PC Servis - Hostinger Node.js setup ===" -ForegroundColor Cyan
Write-Host "Trenutno: www.computerdoctor.in koristi Hostinger HORIZONS (static)." -ForegroundColor Yellow
Write-Host "Email API ne moze raditi dok ne prebacis na Node.js Web App." -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/4] Build..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/4] Env varijable za Hostinger..." -ForegroundColor Green
$envOutput = node scripts/print-hostinger-env.mjs 2>&1 | Out-String
$lines = ($envOutput -split "`n") | Where-Object { $_ -match '^(VITE_|SUPABASE_|SMTP_)' }
$clipboard = ($lines -join "`n").Trim()
Set-Clipboard -Value $clipboard
Write-Host "Env varijable kopirane u clipboard (Ctrl+V u Hostinger panelu)." -ForegroundColor Green
Write-Host $clipboard

Write-Host ""
Write-Host "[3/4] Deploy ZIP..." -ForegroundColor Green
node scripts/package-hostinger-zip.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "[4/4] Otvaranje hPanel..." -ForegroundColor Green
Start-Process "https://hpanel.hostinger.com/websites"
Start-Sleep -Seconds 1
Start-Process "https://hpanel.hostinger.com/profile/api"

$zipPath = Join-Path $root "hostinger-deploy.zip"
Write-Host ""
Write-Host "=== U hPanelu uradi ovo ===" -ForegroundColor White
Write-Host "1. Websites -> computerdoctor.in -> UKLONI stari Horizons/static sajt"
Write-Host "2. Add Website -> Node.js Apps -> Import Git repo computerdoctorpg/computerdoctorpg branch main"
Write-Host ("   ILI Upload ZIP: " + $zipPath)
Write-Host "3. Build: npm run build | Start: npm start | Entry: server.js | Output: dist | Node: 20"
Write-Host "4. Environment variables -> zalijepi iz clipboarda"
Write-Host "5. Deploy i sacekaj 2-5 min"
Write-Host "6. Provjera: curl POST /api/send-ticket-email mora vratiti JSON 401, ne HTML"
Write-Host ""
