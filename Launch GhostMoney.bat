@echo off
REM GhostMoney Browser Launcher
REM Double-click this file to start the app in your browser

echo Starting GhostMoney in browser...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-browser.ps1"
pause
