# Generate Changelog from Git Commits
# This script parses conventional commits and generates changelog entries
#
# USAGE:
#   .\generate-changelog.ps1 -FromCommit abc123 -ToCommit HEAD
#   .\generate-changelog.ps1 -FromTag v1.0.0 -ToTag v1.1.0
#   .\generate-changelog.ps1 -FromTag v1.0.0  # Uses HEAD as ToTag
#   .\generate-changelog.ps1 -Update           # Updates CHANGELOG.md directly

param(
    [string]$FromCommit,
    [string]$ToCommit = "HEAD",
    [string]$FromTag,
    [string]$ToTag = "HEAD",
    [switch]$Update,
    [string]$ChangelogPath = "webapps/documentation/docusaurus/docs/CHANGELOG.md",
    [string]$Version,
    [string]$ReleaseDate = (Get-Date -Format 'yyyy-MM-dd')
)

# If tags are provided, use them
if ($FromTag) {
    $FromCommit = $FromTag
    $ToCommit = $ToTag
}

# Ensure we have commits to process
if (-not $FromCommit) {
    Write-Host "Error: Please specify -FromCommit or -FromTag" -ForegroundColor Red
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\generate-changelog.ps1 -FromTag v1.0.0"
    Write-Host "  .\generate-changelog.ps1 -FromCommit abc123 -ToCommit HEAD"
    exit 1
}

# Get commits between the range
Write-Host "Fetching commits from $FromCommit to $ToCommit..." -ForegroundColor Cyan

try {
    $rawCommits = git log "$FromCommit..$ToCommit" --pretty=format:"%H|%an|%ad|%s" --date=short
    if (-not $rawCommits) {
        Write-Host "No commits found between $FromCommit and $ToCommit" -ForegroundColor Yellow
        exit 0
    }
    
    # Parse commits
    if ($rawCommits -is [string]) {
        $commits = @($rawCommits.Split("`n") | ForEach-Object {
            $parts = $_.Split("|")
            [PSCustomObject]@{
                hash    = $parts[0].Substring(0, 7)
                author  = $parts[1]
                date    = $parts[2]
                message = $parts[3]
                fullHash = $parts[0]
            }
        })
    } else {
        $commits = $rawCommits | ForEach-Object {
            $parts = $_.Split("|")
            [PSCustomObject]@{
                hash    = $parts[0].Substring(0, 7)
                author  = $parts[1]
                date    = $parts[2]
                message = $parts[3]
                fullHash = $parts[0]
            }
        }
    }
} catch {
    Write-Host "Error fetching commits: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($commits.Count) commits" -ForegroundColor Green

# Categorize commits by conventional commit type
$categorized = @{
    feat      = @()
    fix       = @()
    docs      = @()
    refactor  = @()
    perf      = @()
    style     = @()
    test      = @()
    chore     = @()
    breaking  = @()
    other     = @()
}

foreach ($commit in $commits) {
    $message = $commit.message
    $type = "other"
    $scope = ""
    $description = $message
    
    # Parse conventional commit format: type(scope): description
    if ($message -match "^(feat|fix|docs|refactor|perf|style|test|chore)(\(([^)]+)\))?\:\s*(.+)") {
        $type = $matches[1]
        $scope = $matches[3]
        $description = $matches[4]
    } elseif ($message -match "^(feat|fix|docs|refactor|perf|style|test|chore)\:\s*(.+)") {
        $type = $matches[1]
        $description = $matches[2]
    }
    
    # Check for breaking changes
    if ($message -match "BREAKING CHANGE|!:") {
        $type = "breaking"
    }
    
    $categorized[$type] += [PSCustomObject]@{
        message = $description
        scope   = $scope
        author  = $commit.author
        hash    = $commit.hash
        date    = $commit.date
    }
}

# Build changelog entry
$entry = @()

if ($Version) {
    $entry += "## [$Version] - $ReleaseDate"
} else {
    $entry += "## [Unreleased]"
}

$hasEntries = $false

# Breaking Changes
if ($categorized.breaking.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### ⚠️ BREAKING CHANGES"
    foreach ($item in $categorized.breaking) {
        $scope = if ($item.scope) { "($($item.scope))" } else { "" }
        $entry += "- $($item.message) $scope"
    }
}

# Features/Added
if ($categorized.feat.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### ✨ Added"
    foreach ($item in $categorized.feat) {
        $scope = if ($item.scope) { "($($item.scope))" } else { "" }
        $entry += "- $($item.message) $scope"
    }
}

# Fixes
if ($categorized.fix.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### 🐛 Fixed"
    foreach ($item in $categorized.fix) {
        $scope = if ($item.scope) { "($($item.scope))" } else { "" }
        $entry += "- $($item.message) $scope"
    }
}

# Refactor/Changed
if ($categorized.refactor.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### 🔧 Changed"
    foreach ($item in $categorized.refactor) {
        $scope = if ($item.scope) { "($($item.scope))" } else { "" }
        $entry += "- $($item.message) $scope"
    }
}

# Performance
if ($categorized.perf.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### ⚡ Performance"
    foreach ($item in $categorized.perf) {
        $scope = if ($item.scope) { "($($item.scope))" } else { "" }
        $entry += "- $($item.message) $scope"
    }
}

# Docs
if ($categorized.docs.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### 📚 Documentation"
    foreach ($item in $categorized.docs) {
        $entry += "- $($item.message)"
    }
}

# Style
if ($categorized.style.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### 🎨 Style"
    foreach ($item in $categorized.style) {
        $entry += "- $($item.message)"
    }
}

# Tests
if ($categorized.test.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### ✅ Tests"
    foreach ($item in $categorized.test) {
        $entry += "- $($item.message)"
    }
}

# Other
if ($categorized.other.Count -gt 0) {
    $hasEntries = $true
    $entry += ""
    $entry += "### 📝 Other"
    foreach ($item in $categorized.other) {
        $entry += "- $($item.message)"
    }
}

if (-not $hasEntries) {
    $entry += ""
    $entry += "No notable changes"
}

# Display the entry
Write-Host ""
Write-Host "=== Changelog Entry ===" -ForegroundColor Cyan
Write-Host ""
$entry | ForEach-Object { Write-Host $_ }
Write-Host ""

# Update changelog file if requested
if ($Update) {
    if (-not (Test-Path $ChangelogPath)) {
        Write-Host "Error: Changelog file not found at $ChangelogPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Updating $ChangelogPath..." -ForegroundColor Cyan
    
    $content = Get-Content $ChangelogPath -Raw
    $unreleased = "## [Unreleased]"
    
    if ($content -notmatch [regex]::Escape($unreleased)) {
        Write-Host "Error: Could not find [Unreleased] section in changelog" -ForegroundColor Red
        exit 1
    }
    
    # Insert new entry after [Unreleased] section
    $insertionPoint = $content.IndexOf($unreleased) + $unreleased.Length
    $updated = $content.Insert($insertionPoint, "`n`n" + ($entry -join "`n") + "`n`n---")
    
    Set-Content $ChangelogPath -Value $updated -Encoding UTF8
    Write-Host "✓ Changelog updated successfully!" -ForegroundColor Green
} else {
    Write-Host "Tip: Use -Update switch to automatically update CHANGELOG.md" -ForegroundColor Yellow
}
