# Simple Phase 1 Verification

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Phase 1 Build Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$buildPath = ".\build"

# Check build directory
if (Test-Path $buildPath) {
    Write-Host "[OK] Build directory exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Build directory not found!" -ForegroundColor Red
    Write-Host "Run: npm run build" -ForegroundColor Yellow
    exit 1
}

# Check files
Write-Host ""
Write-Host "Checking files..." -ForegroundColor Yellow
Write-Host ""

$files = @(
    "manifest.json",
    "popup.html",
    "popup.bundle.js",
    "background.bundle.js",
    "content.bundle.js",
    "panel.html",
    "panel.bundle.js",
    "devtools.html",
    "options\index.html"
)

$allGood = $true

foreach ($file in $files) {
    $fullPath = Join-Path $buildPath $file
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        Write-Host "[OK] $file - $size bytes" -ForegroundColor Green
    } else {
        Write-Host "[MISSING] $file" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host ""
    Write-Host "SUCCESS! All files present." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open Chrome: chrome://extensions/" -ForegroundColor White
    Write-Host "2. Enable Developer mode" -ForegroundColor White
    Write-Host "3. Click 'Load unpacked'" -ForegroundColor White
    Write-Host "4. Select the 'build' folder" -ForegroundColor White
    Write-Host ""
    Write-Host "For detailed testing: see TESTING_GUIDE.md" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "FAILED - Some files are missing!" -ForegroundColor Red
    Write-Host "Try rebuilding: npm run build" -ForegroundColor Yellow
}

Write-Host ""
