# Run A2A Host Backend Server

Write-Host "Starting A2A Host Server..." -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Error: Virtual environment not found. Please run setup.ps1 first" -ForegroundColor Red
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Check if main.py exists
if (-not (Test-Path "main.py")) {
    Write-Host "Error: main.py not found" -ForegroundColor Red
    exit 1
}

# Start the server
Write-Host "Starting server on http://localhost:8000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn main:app --reload --port 8000 --host 0.0.0.0
