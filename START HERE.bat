@echo off
echo ========================================
@echo off
echo Starting GhostMoney Local Server...
echo ----------------------------------
echo 1. Killing old processes...
taskkill /F /IM node.exe >nul 2>&1

echo 2. Starting Database Server and App...
start /B node server/index.js

echo 3. Waiting for server to start...
timeout /t 3 >nul

echo 4. Opening Browser...
start http://localhost:3001

echo.
echo ========================================================
echo   GhostMoney is running!
echo   Do NOT close this window.
echo   You can minimize it.
echo ========================================================
echo.
echo.
pause
