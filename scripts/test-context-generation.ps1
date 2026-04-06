# Quick test script for context documentation
# Tests the analysis on the feat/bug branch
#
# USAGE:
#   .\test-context-generation.ps1
#   .\test-context-generation.ps1 -Since "3 commits ago"
#   .\test-context-generation.ps1 -Branch "feat/bug"

param(
    [string]$Branch = "feat/bug",
    [string]$Since = "1 day ago",
    [string]$Output = "test-context-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"
)

Write-Host "Testing Context Documentation Generation" -ForegroundColor Cyan
Write-Host ""
Write-Host "Branch: $Branch" -ForegroundColor Yellow
Write-Host "Output: $Output" -ForegroundColor Yellow
Write-Host "Since: $Since" -ForegroundColor Yellow
Write-Host ""

# Run the analysis script
try {
    & ".\scripts\analyze-commits.ps1" -Branch $Branch -Since $Since -Output $Output
} catch {
    Write-Host "Error running analysis: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Test context file created!" -ForegroundColor Green
Write-Host "Location: webapps/documentation/docusaurus/docs/context-logs/$Output" -ForegroundColor Green
