# Quick test script for context documentation
# Tests the analysis on the feat/bug branch
# Generates both Markdown and HTML reports in both markdown and HTML formats
#
# USAGE:
#   .\test-context-generation.ps1
#   .\test-context-generation.ps1 -Since "3 commits ago"
#   .\test-context-generation.ps1 -OpenBrowser

param(
    [string]$Branch = "feat/bug",
    [string]$Since = "1 day ago",
    [switch]$OpenBrowser
)

Write-Host "Testing Context Documentation Generation" -ForegroundColor Cyan
Write-Host ""
Write-Host "Branch: $Branch" -ForegroundColor Yellow
Write-Host "Since: $Since" -ForegroundColor Yellow
Write-Host ""

# Generate timestamp for output filename
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outputFilename = "test-context-$timestamp"

# Run the Node.js analysis script (generates both HTML and Markdown)
try {
    Write-Host "Running analysis..." -ForegroundColor Gray
    node ".\scripts\analyze-commits.js" --branch $Branch --since "$Since" --output $outputFilename
} catch {
    Write-Host "Error running analysis: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Files created:" -ForegroundColor Green
Write-Host "  ✓ Markdown: $outputFilename.md" -ForegroundColor Green
Write-Host "  ✓ HTML: $outputFilename.html" -ForegroundColor Green
Write-Host "  ✓ PDF: $outputFilename.pdf" -ForegroundColor Green
Write-Host "  ✓ PDF: $outputFilename.pdf" -ForegroundColor Green
Write-Host ""
Write-Host "Location: webapps/documentation/docusaurus/docs/context-logs/" -ForegroundColor Cyan
Write-Host ""

# Open browser if requested
if ($OpenBrowser) {
    $htmlPath = "D:\workspace\apache-tomcat-9.0.96\webapps\documentation\docusaurus\docs\context-logs\$outputFilename.html"
    
    Start-Sleep -Milliseconds 500
    
    if (Test-Path $htmlPath) {
        Write-Host "Opening HTML report in browser..." -ForegroundColor Cyan
        Start-Process $htmlPath
        Write-Host "Browser opened successfully!" -ForegroundColor Green
    } else {
        Write-Host "Files were created in: D:\workspace\apache-tomcat-9.0.96\webapps\documentation\docusaurus\docs\context-logs\$outputFilename.html" -ForegroundColor Yellow
    }
}
