# Analyze commits to main branch and generate context documentation
# Detects file changes, associates context, and generates markdown
#
# USAGE:
#   .\analyze-commits.ps1
#   .\analyze-commits.ps1 -Branch "feat/bug"
#   .\analyze-commits.ps1 -Since "2 weeks ago" -Until "now"
#   .\analyze-commits.ps1 -Branch "feat/bug" -Output "test-report.md"

param(
    [string]$Branch = "main",
    [string]$Since = "1 week ago",
    [string]$Until = "now",
    [string]$Output,
    [string]$ContextDir = "D:\workspace\apache-tomcat-9.0.96\webapps\documentation\docusaurus\docs\context-logs",
    [switch]$Detailed
)

# Ensure context directory exists
if (-not (Test-Path $ContextDir)) {
    New-Item -ItemType Directory -Path $ContextDir -Force | Out-Null
}

Write-Host "Analyzing commits to $Branch branch..." -ForegroundColor Cyan
Write-Host "Period: $Since to $Until`n"

# Get commits to main branch
try {
    $rawOutput = git log $Branch --since="$Since" --until="$Until" --pretty=format:"%H|%an|%ad|%s" --date=iso
    
    if (!$rawOutput) {
        Write-Host "No commits found in the specified period" -ForegroundColor Yellow
        exit 0
    }
    
    # Parse manually
    $commits = @()
    $rawOutput -split "`n" | Where-Object { $_ } | ForEach-Object {
        $parts = $_ -split '\|'
        if ($parts.Count -ge 4) {
            $commits += [PSCustomObject]@{
                hash    = $parts[0]
                author  = $parts[1]
                date    = $parts[2]
                message = $parts[3]
            }
        }
    }
} catch {
    Write-Host "Error fetching commits: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($commits.Count) commits`n" -ForegroundColor Green

# Function to get files changed in commit
function Get-FilesChanged {
    param([string]$CommitHash)
    
    $files = git diff-tree --no-commit-id --name-status -r $CommitHash | 
        Where-Object { $_ } |
        ForEach-Object {
            $parts = $_ -split '\s+', 2
            @{
                Status = $parts[0]
                File   = $parts[1]
            }
        }
    
    return $files
}

# Function to categorize files
function Categorize-Files {
    param([array]$Files)
    
    $categories = @{
        Frontend = @()
        Backend  = @()
        UI       = @()
        Tests    = @()
        Docs     = @()
        Config   = @()
        Other    = @()
    }

    foreach ($file in $Files) {
        $path = $file.File.ToLower()

        if ($path -match '(test|spec|vitest)') {
            $categories.Tests += $file
        }
        elseif ($path -match '(ui/|components/|shared/)') {
            $categories.UI += $file
        }
        elseif ($path -match '(client/|playground/)') {
            $categories.Frontend += $file
        }
        elseif ($path -match '(sdk/|api/|server/)') {
            $categories.Backend += $file
        }
        elseif ($path -match '(doc|readme|\.md)') {
            $categories.Docs += $file
        }
        elseif ($path -match '(config|tsconfig|package\.json|biome)') {
            $categories.Config += $file
        }
        else {
            $categories.Other += $file
        }
    }

    return $categories
}

# Build markdown report
$markdown = @()
$markdown += "# Main Branch Activity Report"
$markdown += ""
$markdown += "**Generated:** $(Get-Date -Format 'u')"
$markdown += "**Branch:** $Branch"
$markdown += "**Period:** $Since to $Until"
$markdown += "**Total Commits:** $($commits.Count)"
$markdown += ""
$markdown += "---"
$markdown += ""

foreach ($commit in $commits) {
    $shortHash = $commit.hash.Substring(0, 7)
    $files = Get-FilesChanged $commit.hash
    $categories = Categorize-Files $files

    $markdown += "## $($commit.message)"
    $markdown += ""
    $markdown += "**Commit:** $shortHash"
    $markdown += "**Author:** $($commit.author)"
    $markdown += "**Date:** $($commit.date)"
    $markdown += "**Files Changed:** $($files.Count)"
    $markdown += ""

    # Affected areas
    $areas = @()
    if ($categories.Frontend.Count -gt 0) { $areas += "Frontend" }
    if ($categories.Backend.Count -gt 0) { $areas += "Backend" }
    if ($categories.UI.Count -gt 0) { $areas += "UI Components" }
    if ($categories.Tests.Count -gt 0) { $areas += "Tests" }
    if ($categories.Docs.Count -gt 0) { $areas += "Documentation" }

    if ($areas.Count -gt 0) {
        $markdown += "**Affected Areas:** $($areas -join ', ')"
        $markdown += ""
    }

    # File breakdown
    $markdown += "**File Breakdown:**"
    $markdown += ""

    if ($categories.Frontend.Count -gt 0) {
        $markdown += "- **Frontend** ($($categories.Frontend.Count)):"
        $categories.Frontend | ForEach-Object { $markdown += "  - ``$($_.File)`` [$($_.Status)]" }
    }

    if ($categories.Backend.Count -gt 0) {
        $markdown += "- **Backend** ($($categories.Backend.Count)):"
        $categories.Backend | ForEach-Object { $markdown += "  - ``$($_.File)`` [$($_.Status)]" }
    }

    if ($categories.UI.Count -gt 0) {
        $markdown += "- **UI Components** ($($categories.UI.Count)):"
        $categories.UI | ForEach-Object { $markdown += "  - ``$($_.File)`` [$($_.Status)]" }
    }

    if ($categories.Tests.Count -gt 0) {
        $markdown += "- **Tests** ($($categories.Tests.Count)):"
        $categories.Tests | Select-Object -First 3 | ForEach-Object { $markdown += "  - ``$($_.File)`` [$($_.Status)]" }
        if ($categories.Tests.Count -gt 3) {
            $markdown += "  - ... and $($categories.Tests.Count - 3) more"
        }
    }

    if ($categories.Docs.Count -gt 0) {
        $markdown += "- **Documentation** ($($categories.Docs.Count)):"
        $categories.Docs | ForEach-Object { $markdown += "  - ``$($_.File)`` [$($_.Status)]" }
    }

    $markdown += ""
    $markdown += "---"
    $markdown += ""
}

# Save to file
if (-not $Output) {
    $Output = "context-$(Get-Date -Format 'yyyy-MM-dd').md"
}

$filePath = Join-Path $ContextDir $Output
$markdown | Out-File -FilePath $filePath -Encoding UTF8

Write-Host "Context documentation saved to: $filePath" -ForegroundColor Green
Write-Host ""
Write-Host "Report Preview:" -ForegroundColor Cyan
Write-Host ""
$markdown | ForEach-Object { Write-Host $_ }
