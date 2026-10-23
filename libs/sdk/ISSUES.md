# Outstanding frontend tasks

Frontend work still open after the SDK API consolidation. Resource paths below are
relative to `libs/sdk/src/api/monolith/`; other paths start at the repo root.
Backend findings, audit coverage, and validation are recorded separately under
`targets.api` in the root [semoss-sync.json](../../semoss-sync.json). Follow the
[sync skill](../../skills/semoss-sync.skill.md) for the audit workflow.
Delete completed tasks rather than keeping checked items.

## Incremental application migration

- [ ] Replace the client's string-keyed `useAPI` with the typed `useAPI` from `@semoss/sdk/react` in a separate change.
- [ ] Migrate application REST calls to `@semoss/sdk/api/*` one module at a time. Preserve the supported root `get`, `post`, `CSRF`, and higher-level SDK APIs.
- [ ] Move callers of deprecated legacy REST wrappers to the declaration-documented replacements. The wrappers remain callable for compatibility.

## Fix frontend types that disagree with the Java

- [ ] `libs/shared/src/types.ts` `Project`: `project_global` is a boolean and `group_permission` is a permission id (1, 2 or 3), not strings.
- [ ] `packages/collaboration/src/features/rooms/api/agent-run-api.ts:86-89` (likely runtime bug): the zod tool item requires `name` and `arguments`, so `pollSchema.parse` (line 181) throws on a completed Claude Code tool call and breaks the poll.
- [ ] `libs/sdk/src/stores/insight/insight.store.ts`:
  - `askModel`, and `packages/playground/src/components/prompt/PromptOptimizer.tsx`, type `response` as a `string`. It is a tool-call list for `TOOL` and a map for `IMAGE` / `TTS`.
  - `queryDatabase` types the `Collect` output as a tuple. It is one object: `{ data: { values, headers, rawHeaders }, numCollected, taskId }`.
- [ ] `packages/client/src/stores/config/config.store.ts` `RootConfig`: `availableProviders[].label` and `msGraphLookup` are always present, `version` can be missing, and `MetaKey.display_options` is nullable.
- [ ] `packages/client/src/api/ms-graph.ts` `MsGraphAvailability`: `notificationBaseUrl` is always present.
- [ ] Playground vector `listDocuments`:
  - `packages/playground/src/pages/knowledge-page.tsx` types `fileSize` as a `string`. It is a number, and `fileSize` / `lastModified` can be missing.
  - **Display bug:** `knowledge-detail-page.tsx` `parseSizeBytes` reads the KiB value as bytes, so sizes show 1024× too small. `packages/client/src/components/settings/file-table.tsx` gets this right.

## Adopt URL builders

- [ ] Use `projectImageDownloadUrl`, `imageDownloadUrl`, and `commsUrl` in existing UI callers that still build these URLs by hand.

## Revisit wrappers when backend contracts change

These wrappers work around backend behaviour. Change them when the backend changes.

- [ ] `auth.ts` `login`, `loginLDAP`, `loginLinOTP`, `logout`: these send `disableRedirect: true` by default, because otherwise the backend redirects to an HTML page.
- [ ] `session.ts` `invalidateSession`: always rejects (the backend always answers 302), and it clears the session in `.finally`.
- [ ] `themes.ts` `getAdminThemes`: `limit` and `offset` are required, because the backend throws without them.
- [ ] `ext/a2a.ts` `rpc`, `ext/mcp.ts` `comms`: these set `Accept` to choose which Java method runs.
- [ ] `function-engine.ts` `definition`: always fails with a 400 (misspelled reactor), and `required` is typed as the nested `[] | [string[]]`.
- [ ] `database.ts` `query`: returns the query struct, not rows. Callers use `runPixel` with `Collect`.
- [ ] `vector.ts` `query` (no `filters` / `metaFilters`) and `storage.ts` `deleteFromStorage` (no `leaveFolderStructure`): use pixels until the REST routes forward them.
- [ ] `engine.ts` `pixelJobStreaming`: the `stream_type` union lists only the known chunk types, with dynamic extension payloads; adapt callers explicitly when migrating.

## Other follow-ups

- [ ] `packages/automation/src/components/canvas-editor/tabs/run-node-value-viewer.tsx`: imports `getAutomationRunNodeValue` from `src/api`, which never existed, and nothing imports the viewer. Implement it or delete it.
- [ ] `libs/sdk/src/api/chat.ts` `addRoomToolExecution` and `getUserRooms`: nothing in the repo uses them, but `libs/sdk/skills/sdk-chat/SKILL.md` documents them. Decide whether to remove them.
- [ ] `libs/panels/src/types/access.types.ts:58`: the comment says N panels "cost one pixel", but the lookup is a REST call.
- [ ] `libs/sdk/src/js-frameworks/react/contexts/Insight.context.tsx:8`: imports the package root barrel (`"../../.."`). Import from the defining files instead.
- [ ] Endless polling:
  - `libs/shared/src/components/notebook/notebook.tsx` stops polling the job's console only on `ProgressComplete`, `Streaming` or `Complete`. A job that ends `Error`, `Canceled` or `UnknownJob` is polled every second until the user interrupts.
  - `packages/automation/src/components/canvas-editor/automation-canvas.tsx` polls job streaming forever while it returns `UnknownJob`.
- [ ] `automation-canvas.tsx` `AutomationNodeStreamData`: once it reads `pixelJobStreaming` (the application migration), derive it from the route's `automation` chunk type instead of listing the fields by hand.
- [ ] `packages/cli`:
  - Run a real `deploy` against a SEMOSS server. So far only a local upload smoke test has been run.
  - `package.json` `exports` points at `./lib/index.js`, which doesn't exist.

## Consolidate helpers

- [ ] Collaboration `features/settings/draft-folder-api.ts` and `features/onboarding/onboarding-api.ts`: `str` duplicates utility `asString`. `features/collaboration/live/live-state.ts` has a close variant.

## Test, type and lint debt (fails on HEAD too)

- [ ] Failing tests:
  - client: `assistant-settings.test.tsx`, `team-resource-access-panel.test.tsx`
  - shared: `audit-logs-data-table.test.tsx`, `entity-header.test.tsx`, `file-explorer-item.test.tsx`
  - collaboration: `email-draft-dialog.test.tsx`
  - playground:
    - `workspace-edit.test.tsx`: no `InsightProvider` or `useInsight` mock.
    - `room-attachments.test.ts`: calls the removed `room.teamwork`.
- [ ] `packages/client/src/features/audit-trail/audit-trail.test.tsx`: unhandled `ResizeObserver is not defined`. Stub it in the test setup.
- [ ] `libs/shared/src/components/notebook/notebook-markdown-cell.spec.tsx`: failed once in a full run but passes on its own. Probably flaky.
- [ ] Existing type errors in client, automation, collaboration, terminal, connectors, playground, renderer and chrome-extension (run `tsc --noEmit -p .` in each). Take a per-package baseline before each integration step.
- [ ] Biome `useExhaustiveDependencies`: `libs/renderer/src/hooks/useBlock.tsx` (13), `packages/terminal/src/components/terminal-console/terminal-console.tsx` (6), `packages/terminal/src/components/terminal/upload-modal.tsx` (3), `packages/browser-automation/src/App.tsx` (2, plus `noDefaultExport`). Fixes change hook identities, so give each one its own change.
- [ ] `packages/cli/src/commands/init.ts`: `noUnusedVariables`, `useOptionalChain`. Keep the default export, because oclif needs it.
- [ ] `packages/terminal/src/components/terminal/upload-modal.tsx`: replace the hand-rolled `fixed inset-0` overlay with `Dialog` + `Button`, and drop `z-[100]` / `min-w-[420px]`.
- [ ] Client block settings:
  - `image-block/SelectionTabs/App.tsx`: untyped props and `usePixel<{ data: any }>`.
  - The other `SelectionTabs` files use default exports.
  - `settings/shared/PDFViewerSettings.tsx`: several components in one file, arbitrary-value classes, and a file-level `useExhaustiveDependencies` suppression.
