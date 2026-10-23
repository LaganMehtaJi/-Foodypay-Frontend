@echo off
title FoodyPay Auto-Start Setup
cd /d "%~dp0"

echo Creating auto-start shortcut in Windows Startup folder...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Startup')) 'FoodyPay_Printer_Bridge.lnk')); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"' + (Join-Path '%~dp0' 'run_hidden.vbs') + '\"'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 7; $s.Save(); Write-Output 'Shortcut created in Startup successfully!'"

echo.
echo Setup completed! FoodyPay Printer Bridge will automatically start with Windows in background.
echo.
pause
