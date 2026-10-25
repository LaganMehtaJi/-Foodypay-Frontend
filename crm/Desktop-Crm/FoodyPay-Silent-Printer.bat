@echo off
setlocal enabledelayedexpansion
title FoodyPay Silent Print Service (Port 19090)
color 0A

echo ==========================================================
echo        FOODYPAY SILENT PRINT ENGINE (PORT 19090)
echo ==========================================================
echo [*] Initializing Background Thermal Print Service...

set "FOODYPAY_DIR="
if exist "%~dp0..\PrintServer\server.js" set "FOODYPAY_DIR=%~dp0.."
if not defined FOODYPAY_DIR if exist "%~dp0PrintServer\server.js" set "FOODYPAY_DIR=%~dp0"
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\OneDrive\Desktop\Foodypay-frontend\crm\PrintServer\server.js" set "FOODYPAY_DIR=%USERPROFILE%\OneDrive\Desktop\Foodypay-frontend\crm"
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\Desktop\Foodypay-frontend\crm\PrintServer\server.js" set "FOODYPAY_DIR=%USERPROFILE%\Desktop\Foodypay-frontend\crm"

if not defined FOODYPAY_DIR (
    echo [!] PrintServer folder not found. Please verify FoodyPay path.
    pause
    exit /b 1
)

cd /d "%FOODYPAY_DIR%"
echo [+] Print Server active on Port 19090 (Zero Dialog Direct Spool)
echo [*] Minimizing to background tray...
node PrintServer/server.js
pause
