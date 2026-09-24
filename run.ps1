# SalesPulse Dashboard 1-Click Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting SalesPulse Analytics Dashboard..." -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Backend Setup
Set-Location "$root\backend"
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    & ".\venv\Scripts\Activate.ps1"
}

Write-Host "`n[1/3] Applying database migrations..." -ForegroundColor Yellow
python manage.py migrate --noinput

Write-Host "[2/3] Seeding demo accounts..." -ForegroundColor Yellow
python manage.py seed_demo_data

Write-Host "[3/3] Starting Backend and Frontend servers..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .\venv\Scripts\python manage.py runserver 127.0.0.1:8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  All services started successfully!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  - Backend:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  - Swagger:  http://127.0.0.1:8000/api/docs/" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
