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
APP         = your-app-id                        # Application ID (set by init)
```

## Initialize a New App

Create a new SEMOSS application:

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
# Deploy only Java
semoss deploy -t java

# Make changes to Python
# Deploy only Python
semoss deploy -t py

# Full deployment when ready for production
semoss deploy
```

### CI/CD Integration

```bash
# Package scripts for CI/CD
npm run deploy:java  # Deploy java only
npm run deploy:python  # Deploy python only
npm run deploy  # Full deployment
```

## Troubleshooting

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

## Support

For issues or questions, check the main repository documentation.
