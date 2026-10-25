@echo off
setlocal enabledelayedexpansion
title FoodyPay POS Desktop App & Silent Print Engine
color 0A

echo ==========================================================
echo        FOODYPAY POS DESKTOP APP & SILENT PRINT ENGINE
echo ==========================================================
echo [*] Initializing FoodyPay Desktop Native Environment...
echo [*] Detecting Local Installation & Print Engine...

set "FOODYPAY_DIR="

:: 1. Check relative paths if launched from repo
if exist "%~dp0..\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%~dp0.."
if not defined FOODYPAY_DIR if exist "%~dp0node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%~dp0"
if not defined FOODYPAY_DIR if exist "%~dp0crm\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%~dp0crm"

:: 2. Check standard Windows Desktop / OneDrive directories
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\OneDrive\Desktop\Foodypay-frontend\crm\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%USERPROFILE%\OneDrive\Desktop\Foodypay-frontend\crm"
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\Desktop\Foodypay-frontend\crm\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%USERPROFILE%\Desktop\Foodypay-frontend\crm"
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\OneDrive\Desktop\Foodypay.in\crm\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%USERPROFILE%\OneDrive\Desktop\Foodypay.in\crm"
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\Desktop\Foodypay.in\crm\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%USERPROFILE%\Desktop\Foodypay.in\crm"
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\Desktop\FoodyPay-CRM\crm\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%USERPROFILE%\Desktop\FoodyPay-CRM\crm"
if not defined FOODYPAY_DIR if exist "%USERPROFILE%\OneDrive\Desktop\FoodyPay-CRM\crm\node_modules\electron\dist\electron.exe" set "FOODYPAY_DIR=%USERPROFILE%\OneDrive\Desktop\FoodyPay-CRM\crm"

:: 3. Deep search if run from Downloads folder
if not defined FOODYPAY_DIR (
    echo [*] Searching for FoodyPay Desktop on system...
    for /f "delims=" %%D in ('powershell -NoProfile -Command "(Get-ChildItem -Path $env:USERPROFILE -Filter 'electron.exe' -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*crm*electron*' -or $_.FullName -like '*Foody*' } | Select-Object -First 1).Directory.Parent.Parent.FullName" 2^>nul') do (
        set "FOODYPAY_DIR=%%D"
    )
)

if not defined FOODYPAY_DIR (
    echo [!] Standalone Electron runtime not found in local directories.
    echo [*] Starting High-Speed Chrome Silent Print Kiosk mode...
    start "" chrome.exe --kiosk-printing --app=https://api.foodypay.online/crm/dashboard.html
    exit /b 0
)

echo [+] Located FoodyPay directory: %FOODYPAY_DIR%
cd /d "%FOODYPAY_DIR%"

:: Create Desktop Shortcut for easy future launch directly on Desktop
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desk = [Environment]::GetFolderPath('Desktop'); " ^
  "$sc = $ws.CreateShortcut("$desk\FoodyPay POS Desktop.lnk"); " ^
  "$sc.TargetPath = '%FOODYPAY_DIR%\node_modules\electron\dist\electron.exe'; " ^
  "$sc.Arguments = '.'; " ^
  "$sc.WorkingDirectory = '%FOODYPAY_DIR%'; " ^
  "if (Test-Path '%FOODYPAY_DIR%\Logo.ico') { $sc.IconLocation = '%FOODYPAY_DIR%\Logo.ico'; } " ^
  "$sc.Description = 'FoodyPay POS Native Windows Desktop App'; " ^
  "$sc.Save();" 2>nul

echo [+] Starting FoodyPay Desktop Native Application (Port 19090 Print Engine Active)...
start "" "%FOODYPAY_DIR%\node_modules\electron\dist\electron.exe" .
exit /b 0
