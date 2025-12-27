# Run Backend Server

Write-Host "Starting IT Service Management Chat - Backend" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
    Write-Host "Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "Error: Virtual environment not found. Run setup.ps1 first" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run the server
python main.py
