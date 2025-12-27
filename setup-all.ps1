# Setup All Components
# Run this once to set up all three components

Write-Host "A2UI Chat Application - Complete Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$hasErrors = $false

# Setup Agent
Write-Host "1. Setting up Remote A2A Agent..." -ForegroundColor Yellow
Push-Location agent
& .\setup.ps1
if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
Pop-Location
Write-Host ""

# Setup Backend
Write-Host "2. Setting up A2A Host Server..." -ForegroundColor Yellow
Push-Location backend
& .\setup.ps1
if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
Pop-Location
Write-Host ""

# Setup Frontend
Write-Host "3. Setting up Frontend..." -ForegroundColor Yellow
Push-Location frontend
npm install
if ($LASTEXITCODE -ne 0) { $hasErrors = $true }
Pop-Location
Write-Host ""

if ($hasErrors) {
    Write-Host "Setup completed with errors. Please check the output above." -ForegroundColor Red
}
else {
    Write-Host "Setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start all components, run:" -ForegroundColor Cyan
    Write-Host "  .\start-all.ps1" -ForegroundColor White
}
