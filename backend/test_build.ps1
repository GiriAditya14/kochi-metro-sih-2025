# PowerShell build test script - simulates Render deployment
# This tests if all dependencies can be installed

Write-Host "Testing build process..." -ForegroundColor Cyan
Write-Host "Python version: $(python --version)" -ForegroundColor Green

Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build test successful!" -ForegroundColor Green

Write-Host ""
Write-Host "Testing imports..." -ForegroundColor Cyan
python -c "
import fastapi
import uvicorn
import sqlalchemy
import pandas
import numpy
import ortools
print('All core dependencies imported successfully')
"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Import test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build test completed successfully!" -ForegroundColor Green

