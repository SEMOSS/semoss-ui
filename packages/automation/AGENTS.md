# AGENTS.md - @semoss/automation

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

The Automation Workspace system app: renders an automation's steps, drives a live sequential run,
and exposes a SEMOSS MCP surface for `TriggerAutomation`. It is consumed two ways:

- **As a package.** The client's automation workbench and collaboration's routine flow import
  `src/index.ts` and `./flow-preview` directly, with no iframe or postMessage.
- **As an iframe.** `src/App.tsx` is the `TriggerAutomation` MCP tool's sidebar UI, resolved from
  `SMSS_MCP_UI.resourceURI = "system://automation/"` and fed context by the `SMSS_INIT_TOOL`
  handshake. This is the only legitimate use of postMessage here (theme sync and tool-completion
  signaling to the playground parent).

## Boundaries

- **Must not import:** `@semoss/client` or its stores.
- The public entry points are consumed by other packages; changing them changes those apps. Do not
  move them as incidental cleanup.
- **State:** React state and hooks, no state library. Shared state uses `StoreState`
  ([state standard](../../docs/standards/react.md#state)).

## Backend Pairing

- **One job per run.** `TriggerAutomation(project=[...])` runs every node in order server-side in
  one long-lived job (`AutomationRunEngine`), streaming a per-node progress event
  (running → success/failed) through `PixelJobManager.addStreamOut`, as `HarnessToolExecutor` does
  for tool calls. Start with `runPixelAsync`, poll `getPixelJobStreaming(jobId)`, and fetch the
  final result with `getPixelAsyncResult(jobId)` only after completion. Handle canceled and error
  statuses explicitly. The MCP result's `summary` (e.g. "Indexed 20 files") comes from
  `automation.json`'s optional `resultMessageTemplate`.
- **Never drive nodes one by one** with FE-issued `RunAutomationNode` calls, and never use
  `runPixelAsync`/`getPixelAsyncResult` to await anything shorter than the whole job.
  `getPixelAsyncResult` returns a snapshot, not a wait, so per-node use let a later node start
  before an earlier one persisted its output.
- **Row output pages through the frame.** `GetAutomationRun(project=[...], runId=[...])` includes
  the live execution insight and the standard `FRAME_MAP` noun; page it with
  `Frame | QueryAll | Offset | Limit | Collect`. If the run workspace has closed or the output is
  not tabular, keep the saved output-preview fallback.
- **`control.loop` is a compound node** whose `body` is a nested acyclic workflow graph. Keep the
  body in the canonical workflow document, reuse the normal node forms and catalog, and treat
  expand/collapse as transient canvas state. The backend owns bounded `forEach`, fixed-count
  `repeat`, and condition-based `while`; show them as business choices, expose the backend's
  per-pass variables to nested forms, and never model iteration with a circular React Flow edge.
- **`mcp/pixel_mcp.json`'s `resourceURI`** must match
  `TriggerAutomationReactor.getMcpToolMetadata()` in the Semoss backend repo.

## Validation

```bash
pnpm --filter @semoss/automation type-check
pnpm --filter @semoss/automation test
pnpm --filter @semoss/automation build
pnpm --filter @semoss/client type-check   # the barrel's main consumer
```
