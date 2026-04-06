# Context Documentation Testing Guide

## Testing on feat/bug Branch

The following solutions have been set up to test context documentation generation on the `feat/bug` branch:

### 1. **Local Testing (PowerShell)**

Run the test script to generate context docs from the feat/bug branch:

```powershell
# Test with default settings (last 24 hours)
.\scripts\test-context-generation.ps1

# Test with custom time range
.\scripts\test-context-generation.ps1 -Since "3 days ago"

# Manually analyze feat/bug branch
.\scripts\analyze-commits.ps1 -Branch "feat/bug"
```

Output files will be saved to:
```
webapps/documentation/docusaurus/docs/context-logs/
```

### 2. **GitHub Actions Testing**

Two workflows now support feat/bug branch:

#### **generate-context.yml** (Automated context generation)
- Automatically triggers on commits to `feat/bug`
- Generates context-YYYY-MM-DD.md files
- Can be manually triggered via workflow_dispatch

To trigger manually:
1. Go to `.github/workflows/generate-context.yml`
2. Click "Run workflow"
3. Select branch: `feat/bug`
4. (Optional) Set custom time range in `since` parameter

#### **update-changelog.yml** (PR merge changelog)
- Automatically triggers when PR to `feat/bug` merges
- Generates changelog entry based on commits

### 3. **Manual Node.js Testing**

Run the Node.js analysis script directly:

```bash
# Analyze feat/bug branch
node scripts/analyze-commits.js --branch feat/bug

# With custom time range
node scripts/analyze-commits.js --branch feat/bug --since "2 days ago"

# Save with custom filename
node scripts/analyze-commits.js --branch feat/bug --output "my-test-report.md"
```

### 4. **Test Workflow**

When testing on feat/bug:

1. **Make commits** to the feat/bug branch with conventional commit messages:
   ```
   feat(ui): add new button component
   fix(auth): resolve login issue
   docs: update readme
   ```

2. **Run local test**:
   ```powershell
   .\scripts\test-context-generation.ps1
   ```

3. **Check output** in:
   ```
   webapps/documentation/docusaurus/docs/context-logs/
   ```

4. **Or trigger GitHub Actions** for the full CI/CD test

### 5. **Expected Output**

The context .md files will include:

- **Commit details** (hash, author, date)
- **Files changed breakdown**:
  - Frontend (client/, playground/)
  - Backend (sdk/, api/)
  - UI Components (components/, ui/)
  - Tests
  - Documentation
  - Configuration
  - Other

- **Affected areas** summary
- **File status** (Added, Modified, Deleted)

### 6. **Switching Back to Main**

When testing is complete, workflows will continue to watch:
- `main`
- `master`
- `develop`
- `feat/bug` (for testing)

No changes needed—both systems work in parallel!

---

### Quick Reference Commands

| Task | Command |
|------|---------|
| Test context generation | `.\scripts\test-context-generation.ps1` |
| Analyze feat/bug branch | `.\scripts\analyze-commits.ps1 -Branch "feat/bug"` |
| Node.js analysis | `node scripts/analyze-commits.js --branch feat/bug` |
| Check generated files | `ls webapps/documentation/docusaurus/docs/context-logs/` |
