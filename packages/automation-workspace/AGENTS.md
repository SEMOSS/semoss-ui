# AGENTS.md - @semoss/automation-workspace

This document provides context for AI coding assistants working with the SEMOSS Automation
Workspace system app.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/automation-workspace` is a Vite "system app" that renders an automation's steps,
drives a live sequential run, and exposes a SEMOSS MCP surface for `TriggerAutomation`. It
depends on `@semoss/sdk` and `@semoss/ui` only; it does **not** depend on `@semoss/client` or
any of its MobX stores. Its `src/index.ts` barrel is also consumed directly as a normal package
import — `@semoss/client`'s automation workbench imports `AutomationCanvas`, `InspectorTab`, and
`RunsTab` straight from `@semoss/automation-workspace` and renders them as sibling dock panels
(no iframe, no postMessage) — see `packages/client/src/components/automation-workspace/automation-workbench.tsx`.
The same components are also iframed as the `TriggerAutomation` MCP tool's sidebar UI, resolved
from `SMSS_MCP_UI.resourceURI = "system://automation-workspace/"` and fed context via the
`SMSS_INIT_TOOL` postMessage handshake (see `src/semoss/client.ts`) — that's the one remaining
legitimate use of `src/App.tsx`'s standalone iframe entry point and of postMessage in this
package (theme sync and MCP tool-completion signaling to the playground parent).

## Backend pairing

- `TriggerAutomation(project=[...])` — executes every automation node in order, server-side, in
  one long-lived job (`AutomationRunEngine`). It streams a per-node progress event onto that job
  via `PixelJobManager.addStreamOut` as each node transitions (running → success/failed) —
  mirroring exactly how `HarnessToolExecutor` streams tool-call progress during an agent turn.
  `src/hooks/use-automation-run.ts` starts the job with `runPixelAsync`, polls
  `getPixelJobStreaming(jobId)` for those events (the same primitive playground's
  `runRoomPixelStreaming` uses for live tool-call rendering) to update node status live, and only
  calls `getPixelAsyncResult(jobId)` once the job's status is confirmed `Complete`. Its MCP result
  includes a `summary` field — a per-workflow human-readable message (e.g. "Indexed 20 files")
  resolved from `automation.json`'s optional `resultMessageTemplate`.
- Deliberately does **not** drive individual nodes via separate FE-issued `RunAutomationNode`
  calls, and does not use `runPixelAsync`/`getPixelAsyncResult` as an "await" for anything shorter
  than the whole job — `getPixelAsyncResult` returns a snapshot of the job's current state rather
  than blocking until it finishes, so per-node use of that pair let a later node start before an
  earlier one had actually persisted its output. See `use-automation-run.ts`'s doc comment.

## Build System

- **Bundler**: Vite 8 + React 19
- **Styling**: Tailwind CSS v4 + `@semoss/ui`

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm preview` | Preview the production build |

## Structure

| Folder / file | Purpose |
|---------------|---------|
| `src/index.ts` | Public package barrel — what `@semoss/client` imports directly |
| `src/components/` | Components (one per file) |
| `src/hooks/` | React hooks (`use-<name>.ts`) |
| `src/domain/` | Automation types + display metadata (steps, statuses) |
| `src/semoss/` | SEMOSS integration glue (Env/Insight setup, MCP tool-context handshake) |
| `src/types/` | TypeScript types (`<name>.types.ts`) |
| `src/App.tsx`, `src/main.tsx`, `src/index.css` | Standalone iframe entry, used only by the MCP/playground sidebar UI |
| `mcp/` | MCP configuration (`pixel_mcp.json`) |

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server and build configuration.
- **`mcp/pixel_mcp.json`** — the MCP surface definition; keep `resourceURI` in sync with
  `TriggerAutomationReactor.getMcpToolMetadata()` in the Semoss repo.
- **`src/hooks/use-automation-run.ts`** — the sequential per-node run loop; changing node
  ordering or the polling/await sequence changes correctness guarantees for dependent steps.

### Testing Changes

```bash
pnpm --filter @semoss/automation-workspace type-check
pnpm --filter @semoss/automation-workspace build
```
