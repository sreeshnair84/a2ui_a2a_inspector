# Frontend Setup Script

Write-Host "Setting up IT Service Management Chat - Frontend" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "Found: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check npm version
Write-Host "Checking npm version..." -ForegroundColor Yellow
$npmVersion = npm --version 2>&1
Write-Host "Found: npm v$npmVersion" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Frontend setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the frontend development server, run:" -ForegroundColor Cyan
Write-Host "  .\run-frontend.ps1" -ForegroundColor White
Write-Host ""
