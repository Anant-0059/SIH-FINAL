# PowerShell Launcher for Delhi NCR AQI Dashboard

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Delhi NCR Air Quality Intelligence Dashboard Launcher   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not found in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
    pause
    exit 1
}

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm is not found in PATH." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[OK] Node.js and npm verified." -ForegroundColor Green

$webDir = Join-Path $PSScriptRoot "web"
Set-Location $webDir

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

# Open browser in background
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host "[INFO] Starting Dashboard server on http://localhost:3000 ..." -ForegroundColor Green
npm run dev
