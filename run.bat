@echo off
title CloudVault Launcher
echo ===================================================
echo             Starting CloudVault Services
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Launch Backend in a new dedicated window
echo [1/2] Starting FastAPI Backend on http://0.0.0.0:8000 ...
start "CloudVault Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait 2 seconds before launching frontend
timeout /t 2 /nobreak >nul

:: 2. Launch Frontend in a new dedicated window
echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "CloudVault Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host"

echo.
echo ===================================================
echo Both servers have been launched in separate windows!
echo - Backend:  http://127.0.0.1:8000/docs
echo - Frontend: http://localhost:5173
echo.
echo Keep those command windows open while using CloudVault.
echo ===================================================
echo.
pause
