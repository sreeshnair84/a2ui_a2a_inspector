# Run Remote A2A Agent

Write-Host "Starting Remote A2A Agent..." -ForegroundColor Green

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

# Start the agent
Write-Host "Starting agent on http://localhost:8001..." -ForegroundColor Cyan
Write-Host "Agent Card: http://localhost:8001/.well-known/agent-card.json" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the agent" -ForegroundColor Yellow
Write-Host ""

python main.py
