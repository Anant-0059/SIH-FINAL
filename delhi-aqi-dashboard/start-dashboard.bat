@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo   Delhi NCR Air Quality Intelligence Dashboard Launcher
echo ==========================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (version 18+) from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in PATH!
    pause
    exit /b 1
)

echo [OK] Node.js and npm verified.
echo.

:: 3. Change directory to web folder
cd /d "%~dp0web"

:: 4. Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] First time run detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

:: 5. Open browser in background after short delay
echo [INFO] Starting Delhi NCR AQI Dashboard on http://localhost:3000 ...
start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"

:: 6. Launch Next.js
call npm run dev

pause
