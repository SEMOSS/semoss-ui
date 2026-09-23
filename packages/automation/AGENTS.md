# AGENTS.md - @semoss/automation

This document provides context for AI coding assistants working with the SEMOSS Automation
Workspace system app.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md).

## Overview

`@semoss/automation` is a Vite "system app" that renders an automation's steps,
drives a live sequential run, and exposes a SEMOSS MCP surface for `TriggerAutomation`. It
declares workspace dependencies on `@semoss/i18n`, `@semoss/sdk`, `@semoss/shared`,
`@semoss/ui`, and `@semoss/utility`; it must not import `@semoss/client` or its stores.
Its `src/index.ts` barrel is also consumed directly as a normal package
import — `@semoss/client`'s automation workbench imports `AutomationCanvas`, `InspectorTab`, and
`RunsTab` straight from `@semoss/automation` and renders them as sibling dock panels
(no iframe, no postMessage) — see
[the client workbench](../client/src/components/workbench/automation/automation-workbench.tsx).
The same components are also iframed as the `TriggerAutomation` MCP tool's sidebar UI, resolved
from `SMSS_MCP_UI.resourceURI = "system://automation/"` and fed context via the
`SMSS_INIT_TOOL` postMessage handshake (see `src/semoss/client.ts`) — that's the one remaining
legitimate use of `src/App.tsx`'s standalone iframe entry point and of postMessage in this
package (theme sync and MCP tool-completion signaling to the playground parent).

## Backend pairing

- `TriggerAutomation(project=[...])` — executes every automation node in order, server-side, in
  one long-lived job (`AutomationRunEngine`). It streams a per-node progress event onto that job
  via `PixelJobManager.addStreamOut` as each node transitions (running → success/failed) —
  mirroring exactly how `HarnessToolExecutor` streams tool-call progress during an agent turn.
  Frontend integration must preserve the job lifecycle: start with `runPixelAsync`, poll
  `getPixelJobStreaming(jobId)` for progress, and fetch the successful final result with
  `getPixelAsyncResult(jobId)` only after completion. Handle canceled/error statuses explicitly.
  Its MCP result
  includes a `summary` field — a per-workflow human-readable message (e.g. "Indexed 20 files")
  resolved from `automation.json`'s optional `resultMessageTemplate`.
- Deliberately does **not** drive individual nodes via separate FE-issued `RunAutomationNode`
  calls, and does not use `runPixelAsync`/`getPixelAsyncResult` as an "await" for anything shorter
  than the whole job — `getPixelAsyncResult` returns a snapshot of the job's current state rather
  than blocking until it finishes, so per-node use of that pair let a later node start before an
  earlier one had actually persisted its output. Inspect the current `src/hooks/` and
  `src/api/` integration; the former `use-automation-run.ts` path no longer exists.

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
| `pnpm test` | Run Vitest tests once |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:ui` | Vitest UI |
| `pnpm test:coverage` | Coverage report |

Run these from `packages/automation`, or use `pnpm --filter @semoss/automation <command>`.

## Structure

This is the existing layout. New application features follow the
[React architecture policy](../../skills/react-standard.skill.md#architecture-and-exports),
without relocating the existing public integration surface as an incidental cleanup.

| Folder / file | Purpose |
|---------------|---------|
| `src/index.ts` | Public package barrel — what `@semoss/client` imports directly |
| `src/components/` | Components (one per file) |
| `src/hooks/` | React hooks (`use-<name>.ts`) |
| `src/api/` | Automation backend operations |
| `src/contexts/` | Automation context |
| `src/domain/` | Automation types + display metadata (steps, statuses) |
| `src/semoss/` | SEMOSS integration glue (Env/Insight setup, MCP tool-context handshake) |
| `src/App.tsx`, `src/main.tsx`, `src/index.css` | Standalone iframe entry, used only by the MCP/playground sidebar UI |
| `mcp/` | MCP configuration (`pixel_mcp.json`) |

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server and build configuration.
- **`mcp/pixel_mcp.json`** — the MCP surface definition; keep `resourceURI` in sync with
  `TriggerAutomationReactor.getMcpToolMetadata()` in the Semoss repo.
- **`src/hooks/` and `src/api/`** — changing the run lifecycle, node ordering, or completion
  handling affects correctness for dependent steps.

### Testing Changes

```bash
pnpm --filter @semoss/automation type-check
pnpm --filter @semoss/automation test
pnpm --filter @semoss/automation build
```
