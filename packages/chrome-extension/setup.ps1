# Quick Start Script for Workshop Automation Extension

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Workshop Automation Extension - Quick Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js >= 16" -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Create placeholder icons if they don't exist
Write-Host "Checking for icon files..." -ForegroundColor Yellow
$iconsPath = "src\assets"

if (!(Test-Path $iconsPath)) {
    New-Item -ItemType Directory -Force -Path $iconsPath | Out-Null
}

$iconSizes = @(16, 48, 128)
$missingIcons = $false

foreach ($size in $iconSizes) {
    $iconPath = "$iconsPath\icon-$size.png"
    if (!(Test-Path $iconPath)) {
        $missingIcons = $true
        Write-Host "  ⚠ Missing: icon-$size.png" -ForegroundColor Yellow
    }
}

if ($missingIcons) {
    Write-Host ""
    Write-Host "Note: Icon files are missing. The extension will still work," -ForegroundColor Yellow
    Write-Host "but you may see warnings. Add icon files later to:" -ForegroundColor Yellow
    Write-Host "  - src\assets\icon-16.png" -ForegroundColor Cyan
    Write-Host "  - src\assets\icon-48.png" -ForegroundColor Cyan
    Write-Host "  - src\assets\icon-128.png" -ForegroundColor Cyan
} else {
    Write-Host "✓ All icon files found" -ForegroundColor Green
}

Write-Host ""

# Build the extension
Write-Host "Building extension..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Extension built successfully!" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Setup Complete! 🎉" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Chrome and go to: chrome://extensions/" -ForegroundColor White
Write-Host "2. Enable 'Developer mode' (top right toggle)" -ForegroundColor White
Write-Host "3. Click 'Load unpacked'" -ForegroundColor White
Write-Host "4. Select the 'build' folder from this directory" -ForegroundColor White
Write-Host ""
Write-Host "5. Click the extension icon in Chrome" -ForegroundColor White
Write-Host "6. Configure your Workshop settings (⚙️ button)" -ForegroundColor White
Write-Host "7. Start automating!" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: SETUP.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Development mode (auto-rebuild on changes):" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
