# Analyze commits and generate HTML report
# Detects file changes, associates context, and generates HTML documentation
#
# USAGE:
#   .\analyze-commits-html.ps1
#   .\analyze-commits-html.ps1 -Branch "feat/bug"
#   .\analyze-commits-html.ps1 -Since "2 weeks ago" -Until "now"

param(
    [string]$Branch = "main",
    [string]$Since = "1 week ago",
    [string]$Until = "now",
    [string]$ContextDir = "D:\workspace\apache-tomcat-9.0.96\webapps\documentation\docusaurus\docs\context-logs",
    [switch]$OpenBrowser
)

Write-Host "Generating HTML Context Report..." -ForegroundColor Cyan
Write-Host "Branch: $Branch | Since: $Since" -ForegroundColor Yellow

# Use Node.js script for better HTML generation
if (Test-Path ".\scripts\analyze-commits.js") {
    $output = node ".\scripts\analyze-commits.js" --branch $Branch --since "$Since" --until "$Until"
    Write-Host $output
    
    # Find the generated HTML file
    $htmlFile = Get-ChildItem -Path $ContextDir -Filter "*.html" -ErrorAction SilentlyContinue | Sort-Object CreationTime -Descending | Select-Object -First 1
    
    if ($htmlFile -and $OpenBrowser) {
        Write-Host "Opening HTML report in browser..." -ForegroundColor Green
        Start-Process $htmlFile.FullName
    } elseif ($htmlFile) {
        Write-Host "HTML report saved: $($htmlFile.FullName)" -ForegroundColor Green
        Write-Host "Tip: Add -OpenBrowser to view in browser" -ForegroundColor Yellow
    }
} else {
    Write-Host "Error: analyze-commits.js not found" -ForegroundColor Red
}
