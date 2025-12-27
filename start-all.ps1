# Quick Start - Launch All Components
# This script starts Agent, Backend, and Frontend in separate terminals

Write-Host "A2UI Chat Application - Quick Start" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if all directories exist
$agentPath = "agent"
$backendPath = "backend"
$frontendPath = "frontend"

if (-not (Test-Path $agentPath)) {
    Write-Host "Error: agent directory not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $backendPath)) {
    Write-Host "Error: backend directory not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "Error: frontend directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "Starting all components..." -ForegroundColor Green
Write-Host ""

# Start Agent in new terminal
Write-Host "1. Starting Remote A2A Agent (port 8001)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\agent'; .\run.ps1"
Start-Sleep -Seconds 2

# Start Backend in new terminal
Write-Host "2. Starting A2A Host Server (port 8000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\run.ps1"
Start-Sleep -Seconds 2

# Start Frontend in new terminal
Write-Host "3. Starting Frontend (port 5173)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "All components starting..." -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Agent:    http://localhost:8001" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Agent Card: http://localhost:8001/.well-known/agent.json" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit (this will NOT stop the services)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
