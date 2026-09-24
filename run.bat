@echo off
title SalesPulse Dashboard Launcher
echo ========================================================
echo   Starting SalesPulse Analytics Dashboard...
echo ========================================================
echo.

:: 1. Backend Migration & Setup
cd /d "%~dp0backend"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo [1/3] Applying database migrations...
python manage.py migrate --noinput

echo [2/3] Ensuring demo accounts are ready...
python manage.py seed_demo_data

echo [3/3] Launching Backend & Frontend servers...
start "SalesPulse Backend (Django)" cmd /k "python manage.py runserver 127.0.0.1:8000"

cd /d "%~dp0frontend"
start "SalesPulse Frontend (Vite)" cmd /k "npm run dev"

echo.
echo ========================================================
echo   Application started successfully!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - Swagger:  http://127.0.0.1:8000/api/docs/
echo ========================================================
echo.
pause
