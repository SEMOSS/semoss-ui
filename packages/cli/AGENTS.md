# AGENTS.md - @semoss/cli

This document provides context for AI coding assistants working with the SEMOSS CLI.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> applies its TypeScript rules here, not React UI architecture. The published CLI targets a
> different Node range (see below); repository tooling still uses the root requirements.

## Overview

`@semoss/cli` is a published command-line tool for deploying and initializing SEMOSS apps. It
is built with the **oclif** framework. Its only workspace runtime dependency is
`@semoss/sdk`; external dependencies include oclif plugins, `adm-zip`, `dotenv`, `glob`,
and `listr`.

## Build System

- **Framework**: oclif
- **Build**: TypeScript project references — `tsc -b` (no bundler, no dev server).
- **Runtime**: **Node `>=20`** (looser than the monorepo's `>=24.4.0` — this package ships to
  end users).

### Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Clean `dist/` and compile (`shx rm -rf dist && tsc -b`) |

Run from `packages/cli`, or use `pnpm --filter @semoss/cli build` from the root.

Run the built CLI via its bin entry (`./bin/run.js`); oclif discovers commands from
`./dist/commands`.

**Packaging caveat:** `package.json` currently points `exports` to `./lib/index.js`, while
its `files`, `types`, and oclif command paths use `dist/`. There is no local `lib/index.js`.
Do not assume the library import entry works because the CLI bin works; this mismatch needs
a separately scoped package-config fix and publish validation.

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

There is no declared `test` script. Do not claim a package test command passed; validate
the build and exercise affected commands explicitly.

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
