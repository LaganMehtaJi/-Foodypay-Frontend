@echo off
title FoodyPay POS - Setup Silent Printing Shortcut
color 0E
cd /d "%~dp0"

echo ==========================================================
echo    FOODYPAY 1-CLICK SILENT PRINT SHORTCUT GENERATOR
echo ==========================================================
echo.
echo [*] Searching for Google Chrome or Microsoft Edge...

set BROWSER_EXE=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_EXE="%LocalAppData%\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_EXE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_EXE="C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

if %BROWSER_EXE%=="" (
    echo [!] Could not locate Chrome or Edge executable.
    pause
    exit /b 1
)

echo [+] Located Browser: %BROWSER_EXE%
echo [*] Generating Desktop Shortcut with --kiosk-printing flag...

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desk = [Environment]::GetFolderPath('Desktop'); " ^
  "$sc = $ws.CreateShortcut(\"$desk\FoodyPay POS (Silent Print).lnk\"); " ^
  "$sc.TargetPath = %BROWSER_EXE%; " ^
  "$sc.Arguments = '--kiosk-printing --app=https://api.foodypay.online/crm/dashboard.html'; " ^
  "$sc.Description = 'FoodyPay POS with Zero-Dialog Silent Printing'; " ^
  "$sc.Save(); " ^
  "Write-Host '[SUCCESS] Shortcut \"FoodyPay POS (Silent Print)\" created on your Desktop!';"

echo.
echo ==========================================================
echo  DONE! Double-click "FoodyPay POS (Silent Print)" on your
echo  Desktop. Any bill or KOT print will output instantly
echo  WITHOUT opening any print dialog box!
echo ==========================================================
echo.
pause
