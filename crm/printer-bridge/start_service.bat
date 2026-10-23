@echo off
title FoodyPay Silent Print Bridge
cd /d "%~dp0"
echo ========================================================
echo    FoodyPay POS Silent Printer Service
echo    (KOT aur Bill bina print dialog box ke print karne ke liye)
echo ========================================================
echo.
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Starting Print Bridge on http://127.0.0.1:19999 ...
node printer_service.js
pause
