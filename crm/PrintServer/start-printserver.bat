@echo off
title FoodyPay Print Server
color 0A
echo ========================================================
echo        FOODYPAY LOCAL PRINT SERVER (ZERO JAVA / NO QZ)
echo ========================================================
echo.
echo Starting FoodyPay Local Print Server on http://127.0.0.1:19090 ...
echo.
cd /d "%~dp0"
node server.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start PrintServer. Make sure Node.js is installed.
    pause
)
