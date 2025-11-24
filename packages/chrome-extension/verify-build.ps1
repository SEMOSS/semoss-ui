# Quick Phase 1 Verification Script

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Verification - Workshop Extension" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$buildPath = ".\build"
$errors = @()
$warnings = @()

Write-Host "Checking Build Files..." -ForegroundColor Yellow

# Check if build directory exists
if (!(Test-Path $buildPath)) {
    $errors += "Build directory not found. Run 'npm run build' first."
    Write-Host "✗ Build directory missing" -ForegroundColor Red
} else {
    Write-Host "✓ Build directory found" -ForegroundColor Green
}

# Check critical files
$criticalFiles = @(
    "manifest.json",
    "popup.html",
    "popup.bundle.js",
    "background.bundle.js",
    "content.bundle.js",
    "options\index.html"
)

Write-Host "`nChecking Critical Files:" -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    $filePath = Join-Path $buildPath $file
    if (Test-Path $filePath) {
        $size = (Get-Item $filePath).Length
        Write-Host "  ✓ $file ($size bytes)" -ForegroundColor Green
    } else {
        $errors += "Missing file: $file"
        Write-Host "  ✗ $file - MISSING" -ForegroundColor Red
    }
}

# Check manifest.json content
Write-Host "`nValidating Manifest:" -ForegroundColor Yellow
$manifestPath = Join-Path $buildPath "manifest.json"
if (Test-Path $manifestPath) {
    try {
        $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
        
        if ($manifest.manifest_version -eq 3) {
            Write-Host "  ✓ Manifest Version 3" -ForegroundColor Green
        } else {
            $errors += "Invalid manifest version"
            Write-Host "  ✗ Wrong manifest version" -ForegroundColor Red
        }
        
        if ($manifest.name) {
            Write-Host "  ✓ Name: $($manifest.name)" -ForegroundColor Green
        }
        
        if ($manifest.version) {
            Write-Host "  ✓ Version: $($manifest.version)" -ForegroundColor Green
        }
        
        $requiredPerms = @("tabs", "activeTab", "storage", "debugger")
        foreach ($perm in $requiredPerms) {
            if ($manifest.permissions -contains $perm) {
                Write-Host "  ✓ Permission: $perm" -ForegroundColor Green
            } else {
                $warnings += "Missing permission: $perm"
                Write-Host "  ! Warning: Missing permission $perm" -ForegroundColor Yellow
            }
        }
        
    } catch {
        $errors += "Invalid JSON in manifest.json"
        Write-Host "  ✗ Invalid manifest JSON" -ForegroundColor Red
    }
}

# Check file sizes
Write-Host "`nChecking Bundle Sizes:" -ForegroundColor Yellow
$bundles = @{
    "popup.bundle.js" = 100000  # Should be around 148KB
    "background.bundle.js" = 1000  # Should be around 2KB
    "content.bundle.js" = 1000  # Should be around 1.8KB
}

foreach ($bundle in $bundles.Keys) {
    $bundlePath = Join-Path $buildPath $bundle
    if (Test-Path $bundlePath) {
        $size = (Get-Item $bundlePath).Length
        $minSize = $bundles[$bundle]
        $sizeKB = [math]::Round($size/1KB, 2)
        if ($size -gt $minSize) {
            Write-Host "  ✓ ${bundle}: ${sizeKB} KB" -ForegroundColor Green
        } else {
            $warnings += "$bundle seems too small"
            Write-Host "  ! ${bundle}: ${size} bytes (might be incomplete)" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✓ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "`nYour extension is ready to load in Chrome!" -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "1. Open Chrome and go to: chrome://extensions/" -ForegroundColor White
    Write-Host "2. Enable 'Developer mode'" -ForegroundColor White
    Write-Host "3. Click 'Load unpacked'" -ForegroundColor White
    Write-Host "4. Select the 'build' folder" -ForegroundColor White
    Write-Host "`nFor detailed testing, see: TESTING_GUIDE.md" -ForegroundColor Yellow
} else {
    if ($errors.Count -gt 0) {
        Write-Host "✗ ERRORS FOUND ($($errors.Count)):" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n! WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nSuggested Fixes:" -ForegroundColor Cyan
    if ($errors.Count -gt 0) {
        Write-Host "1. Rebuild the extension: npm run build" -ForegroundColor White
        Write-Host "2. Check for build errors in the terminal" -ForegroundColor White
        Write-Host "3. Verify all source files exist in src/ directory" -ForegroundColor White
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
