@echo off
REM ============================================
REM COSMO 2.0 - Start Auto GitHub Sync
REM Runs in background, syncs every 60 seconds
REM ============================================

echo Starting Auto GitHub Sync...
echo (This window will stay open - minimize it)
echo.

powershell -ExecutionPolicy Bypass -File "C:\VBOX\devserver\dev_01\auto_sync_github.ps1"
