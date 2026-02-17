# @semoss/cli

@semoss/cli is a command-line tool that accelerates the process of deploying SEMOSS applications.

## Getting Started

### Recommended Installation

The best way to install the CLI is to build it locally from source:

```sh
# Navigate to the CLI package
cd packages/cli

# Install dependencies
pnpm install
# or if you prefer npm:
# npm install

# Build the CLI
pnpm build
# or with npm:
# npm run build

# Install globally
npm install -g ./
```

### Alternative: Global NPM Install

If you prefer to install the pre-built version:

```sh
npm install -g @semoss/cli
```

If you encounter issues with either installation method, try the opposite one or rebuild from source.

## Setup

First, define environment variables in your `.env` file:

```env
ENDPOINT    = https://your-semoss-server.com      # Server endpoint
MODULE      = /Monolith                           # Application module path
ACCESS_KEY  = your-access-key-here               # Access key for server
SECRET_KEY  = your-secret-key-here               # Secret key for server
APP         = your-app-id                        # Application ID (set by init/create)
```

## Initialize a New App

### Option 1: Start with an Existing Codebase (init)

If you already have a SEMOSS project directory, initialize it with the CLI:

```sh
semoss init --name="My App Name"
# or
semoss init -n="My App Name"
```

This will:
- Validate your environment variables
- Create a new project on the server
- Save the app ID to your `.env` file
- Create a `smss.json` configuration file

### Option 2: Get a Head Start with a Template (create)

If you don't have a codebase yet, use the create command to generate a complete base template app:

```sh
semoss create --name="My App Name"
# or
semoss create -n="My App Name"
```

This will:
- Create a new project directory with your app name
- Generate a base template structure with Java, Python, and Portal examples
- Set up package.json and configuration files
- Automatically include `.gitignore` with deployment artifact exclusions

Then navigate to your new directory and set up:

```sh
cd my-app-name

# Install dependencies
pnpm install

# Configure your server details
cp .env.example .env
# Edit .env with your SEMOSS server details

# Initialize the project on the server
semoss init --name="My App Name"
```

Optionally, you can see the app running locally:

```sh
# Start development server
pnpm dev
```

When ready to deploy:

```sh
semoss deploy
```

## Deployment

### Full Deployment (All Files)

Deploy everything in the current directory:

```sh
semoss deploy
```

This will:
1. Zip all files (excluding ignored patterns)
2. Delete all assets on the server
3. Upload the zip file
4. Extract files on the server
5. Reload custom classes/reactors
6. Publish the app

### Selective Deployment by Target

Deploy only specific directories:

```sh
# Deploy only the java folder
semoss deploy --target java
semoss deploy -t java

# Deploy multiple targets
semoss deploy --target java --target py
semoss deploy -t java -t py
```

When using `--target`, only the specified directory assets are deleted on the server (not everything).

### Deployment Examples

```bash
# Full deployment
semoss deploy

# Deploy just Java backend
semoss deploy -t java

# Deploy just Python scripts
semoss deploy -t py

# Deploy both with verbose output
semoss deploy -t java -t portals --verbose

# Deploy with timing information
semoss deploy -t java --show-timing

# Super verbose with raw responses
semoss deploy -t java --super-verbose --show-raw

# Dry-run to preview without deploying
semoss deploy --dry-run

# Rollback to previous deployment
semoss deploy --rollback
```

## Ignored Files

By default, these files/folders are excluded from deployment:

- `node_modules/**`
- `**/.git/**`
- `**/*.local`
- `client/**`
- `**/package.json`
- `**/package-lock.json`
- `**/pnpm-lock.yaml`
- `**/vite.config.ts` & `**/vite.config.js`
- `**/vitest.config.ts` & `**/vitest.config.js`

## Available Flags

### General Options

| Flag | Short | Description | Example |
|------|-------|-------------|---------|
| `--env` | `-e` | Path to .env file | `--env .env.production` |
| `--config` | `-c` | Path to config file | `--config smss.json` |

### Deployment Targets

| Flag | Short | Description | Example |
|------|-------|-------------|---------|
| `--target` | `-t` | Target directory to deploy (can use multiple times) | `-t java -t py -t portals` |

### Debugging & Verbosity

| Flag | Short | Description |
|------|-------|-------------|
| `--debug` | `-d` | Enable debug logging |
| `--verbose` | `-v` | Enable verbose output |
| `--super-verbose` | `-s` | Enable super verbose (includes all debug info) |
| `--breakpoint` | `-b` | Add debugger breakpoint for debugging |
| `--show-env` | | Show environment variables |
| `--show-timing` | | Show timing information for each step |
| `--show-raw` | | Show raw API responses |

### Deployment Safety & Recovery

| Flag | Short | Description | Example |
|------|-------|-------------|---------|
| `--dry-run` | | Preview deployment without actually deploying | `semoss deploy --dry-run` |
| `--rollback` | `-r` | Rollback to previous deployment | `semoss deploy --rollback` |

## Deployment Behavior

### Full Deploy (`semoss deploy`)
- ✅ Deletes **ALL** assets in `version/assets/`
- ✅ Uploads entire directory as zip
- ✅ Extracts to app directory

### Targeted Deploy (`semoss deploy -t java`)
- ✅ Deletes **ONLY** `version/assets/java/`
- ✅ Uploads only java folder as zip
- ✅ Faster uploads for large projects
- ✅ Doesn't affect other target directories

## Safety & Recovery Features

### Dry-Run Mode

Preview your deployment without actually deploying:

```bash
# See what would be deployed
semoss deploy --dry-run

# Test a targeted deployment
semoss deploy -t java --dry-run

# Verbose dry-run to see all details
semoss deploy --dry-run --verbose
```

Dry-run mode:
- ✅ Creates and validates the zip file
- ✅ Shows what files would be deployed
- ✅ Shows deployment size
- ✅ Does NOT delete assets on the server
- ✅ Does NOT upload to the server

### Automatic Backups

Before each deployment, the CLI automatically:
1. Validates connection with 1+1 reactor test
2. Creates a backup from the server after connection is confirmed
3. Stores backup metadata with timestamp and targets
4. Saves deployment information for rollback

Backups are organized as:
```
.semoss-backups/
├── full-2025-02-16T10-30-45-123Z/
│   ├── metadata.json
│   ├── backup.zip
│   └── assets/
├── java-2025-02-16T11-25-30-456Z/
│   ├── metadata.json
│   ├── backup.zip
│   └── assets/
└── java-py-2025-02-16T12-15-20-789Z/
    ├── metadata.json
    ├── backup.zip
    └── assets/
```

**Backup Process:**
- Runs after successful server connection (1+1 reactor test)
- Uses Node.js http/https to download exported files
- Calls ExportProjectApp reactor to export assets from server
- Extracts assets folder from exported zip
- Stores backup with timestamp and deployment targets
- Skipped with `--dry-run` flag
- Backup failure is non-blocking: deployment continues if backup fails (logged as warning)

### Rollback to Previous Deployment

Quickly recover from a failed or incorrect deployment:

```bash
# Rollback to the most recent successful deployment
semoss deploy --rollback

# Short form using -r
semoss deploy -r
```

**Rollback behavior:**
- ✅ Loads the most recent backup created before the last deployment
- ✅ **Restores the complete previous state** (not just specific targets)
- ✅ Ignores `--target` flags (always performs full restore)
- ✅ Does **NOT** create a new backup during rollback (preserves existing backup for recovery)
- ✅ Sends you back one deployment step
- ✅ Shows the backup directory path used

**Example rollback scenarios:**

```bash
# You made a full deployment that broke the app
semoss deploy
# Something went wrong...

# Rollback to previous version
semoss deploy --rollback

# OR use short flag
semoss deploy -r

# Rollback ignores targets - this restores the complete previous state
# NOT just the java folder, even though only java was targeted last time
semoss deploy -t java --rollback  # Still restores full previous deployment
```

### Deployment History

Every deployment is logged to `.semoss-deployments` file:

```json
[
  {
    "timestamp": "2025-02-16T12:15:20.789Z",
    "app": "my-app",
    "module": "/insight",
    "targets": ["java"],
    "status": "success",
    "zipSize": 1024000,
    "duration": 3245,
    "backupDir": ".semoss-backups/java-2025-02-16T12-15-20-789Z",
    "rollback": false
  },
  {
    "timestamp": "2025-02-16T11:25:30.456Z",
    "app": "my-app",
    "module": "/insight",
    "targets": "all",
    "status": "success",
    "duration": 8920,
    "backupDir": null,
    "rollback": true
  }
]
```

The file stores the last 20 deployments with:
- Timestamp and duration
- Deployment targets
- Zip file size (only for regular deployments, not rollbacks)
- Status (success/failure/dry-run)
- Rollback flag (indicates if this was a rollback operation)
- Backup directory reference (null for rollbacks since they don't create new backups)

## Cleaning Up Backups

Over time, backup files accumulate and consume disk space. Use the cleanup command to remove backups and deployment history:

### Cleanup Command

Remove all backups and deployment history from current directory:

```bash
# List backups without deleting
semoss cleanup --list

# Interactive cleanup (asks for confirmation)
semoss cleanup

# Force delete all backups and history without confirmation
semoss cleanup --force

# Verbose output showing what's being deleted
semoss cleanup --verbose
```

### Cleanup Flags

| Flag | Short | Description | Example |
|------|-------|-------------|---------|
| `--list` | `-l` | List all backups without deleting | `semoss cleanup --list` |
| `--force` | `-f` | Force delete without confirmation | `semoss cleanup --force` |

| `--verbose` | `-v` | Show detailed output | `semoss cleanup --verbose` |

### Cleanup Behavior

The cleanup command:
- ✅ Shows all backups with sizes (in KB, MB, GB)
- ✅ Calculates total backup space
- ✅ Asks for confirmation before deletion (unless `--force`)
- ✅ Deletes individual backup directories
- ✅ Removes empty `.semoss-backups` directory
- ✅ Always deletes `.semoss-deployments` history file (prevents stale backup references and broken rollback chains)
- ✅ Shows how much space was freed

### Example Usage

```bash
# Check what backups exist
$ semoss cleanup --list
📋 Found the following backups:
  • full-2025-02-16T10-30-45-123Z (15.3 MB)
  • java-2025-02-16T11-25-30-456Z (2.1 MB)
  • java-py-2025-02-16T12-15-20-789Z (8.7 MB)

💾 Total backup size: 26.1 MB

# Delete with confirmation
$ semoss cleanup
Are you sure you want to delete all backups? (yes/no) yes
🗑️  Deleting backups...
  ✅ Deleted: full-2025-02-16T10-30-45-123Z
  ✅ Deleted: java-2025-02-16T11-25-30-456Z
  ✅ Deleted: java-py-2025-02-16T12-15-20-789Z
  ✅ Deleted empty backup directory

🎉 Cleanup complete! Freed up 26.1 MB
```

## Configuration File (Optional)

Create `smss.json` in your project root for additional configuration:

```json
{
  "app": "your-app-id",
  "name": "Your App Name",
  "deploy": {
    "ignore": [
      "custom-folder/**",
      "*.backup"
    ]
  }
}
```

## Workflow Examples

### Development Workflow

```bash
# Make changes to Java code
# Preview before deploying
semoss deploy -t java --dry-run

# Deploy only Java
semoss deploy -t java

# Make changes to Python
# Deploy only Python
semoss deploy -t py

# Full deployment when ready for production
semoss deploy
```

### Safe Deployment Workflow

```bash
# 1. Preview deployment
semoss deploy --dry-run

# 2. If something goes wrong, rollback
semoss deploy --rollback

# 3. Check deployment history
cat .semoss-deployments
```

### Targeted Deployment with Safety

```bash
# 1. Preview Java deployment
semoss deploy -t java --dry-run --verbose

# 2. Check history
cat .semoss-deployments | jq '.[-1]'
```

### CI/CD Integration

```bash
# Package scripts for CI/CD
npm run deploy:java  # Deploy java only
npm run deploy:python  # Deploy python only
npm run deploy  # Full deployment

# Deployments will be logged to .semoss-deployments
```

## Troubleshooting

### Deployment Failed

If a deployment fails, you have several options:

```bash
# 1. Check deployment history to see what went wrong
cat .semoss-deployments | jq '.[-1]'

# 2. Use dry-run to test the fix
semoss deploy --dry-run

# 3. Rollback to previous working version
semoss deploy --rollback

# 4. Retry the deployment with verbose output
semoss deploy --verbose
```

### Target directory not found
Make sure the directory exists in your current working directory:
```bash
semoss deploy -t my-folder  # my-folder must exist
```

### Missing environment variables
The following are required:
- `ENDPOINT` - Server endpoint URL
- `MODULE` - Module path (e.g., /semoss/insight)
- `ACCESS_KEY` - Access key
- `SECRET_KEY` - Secret key
- `APP` - Application ID (set after running init)

### Large deployments timeout
For large deployments, use targeted deploys:
```bash
semoss deploy -t java      # Deploy in smaller chunks
semoss deploy -t py
semoss deploy -t portals
```


### Backups not created
Backups are created in a `.semoss-backups` directory. If backups fail:
1. Check that you have write permissions in the current directory
2. Ensure `.semoss-backups` directory can be created
3. Check disk space availability
4. Verify the SEMOSS server is accessible and running
5. Use `--verbose` or `--debug` to see backup errors

### Large backups consuming disk space
Backups accumulate over time. Clean them up using the cleanup command:

```bash
# List backups and see how much space they use
semoss cleanup --list

# Delete all backups and free up space
semoss cleanup --force

# Delete backups and deployment history
semoss cleanup --force --history
```

### Rollback says no backup found
This means:
1. No previous successful deployments exist in history
2. You haven't run a successful deployment yet
3. `.semoss-deployments` file doesn't exist

To fix:
```bash
# Deploy once successfully first
semoss deploy

# Then rollback is available
semoss deploy --rollback
```

## Git Ignore Best Practices

The CLI creates deployment artifacts that should **not** be committed to Git:

```gitignore
# Add these to your .gitignore
.semoss-backups/    # Local backup files
.semoss-deployments # Deployment history
```

**Why gitignore them?**
- They're runtime artifacts, not source code
- They can be large (MB/GB) and bloat your repository
- They're environment-specific (different per machine/deployment)
- They can cause merge conflicts if multiple people are deploying
- They're for local/server recovery, not repository management

**Automatic inclusion:** If you use `semoss create` to initialize a new app, these entries are automatically included in the generated `.gitignore` file.

## Support

For issues or questions, check the main repository documentation.
