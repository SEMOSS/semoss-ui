# AGENTS.md - @semoss/cli

This document provides context for AI coding assistants working with the SEMOSS CLI.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, commit
> messages, and Biome config. **Note:** the CLI targets a different Node range (see below).

## Overview

`@semoss/cli` is a published command-line tool for deploying and initializing SEMOSS apps. It
is built with the **oclif** framework and depends only on `@semoss/sdk`.

## Build System

- **Framework**: oclif
- **Build**: TypeScript project references — `tsc -b` (no bundler, no dev server).
- **Runtime**: **Node `>=20`** (looser than the monorepo's `>=24.4.0` — this package ships to
  end users).

### Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Clean `dist/` and compile (`shx rm -rf dist && tsc -b`) |

Run the built CLI via its bin entry (`./bin/run.js`); oclif discovers commands from
`./dist/commands`.

## Structure

A Node CLI (no React, no `pages/`):

| Folder / file | Purpose |
|---------------|---------|
| `src/commands/` | One oclif `Command` per file (`init.ts`, `deploy.ts`) |
| `src/constants.ts` | Shared constants |
| `src/types.ts` | Shared TypeScript types |
| `src/index.ts` | Package entry |
| `bin/` | Executable entry (`run.js`) |
| `test/` | Tests |

## Agent Guardrails

### Do Not Modify

- **`dist/`** — build output.
- **`oclif.manifest.json`** / **`npm-shrinkwrap.json`** — generated for the published package.

### Be Cautious With

- **`bin/`** and the `oclif` block in `package.json` — command discovery and the published bin.
- **Node version assumptions** — keep code compatible with Node 20.

### When Adding a Command

1. Add a new file under `src/commands/` following the existing oclif `Command` pattern.
2. Build and exercise the command:
   ```bash
   pnpm --filter @semoss/cli build
   ./packages/cli/bin/run.js <command>
   ```
