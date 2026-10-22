# Outstanding frontend tasks

Front-end work still open for `@semoss/monolith`. Route files are under
`src/routes/`. Other paths start at the repo root. Tick an item off by deleting it.

## Integrate into the SDK and the apps

Steps 1 (bundled into the SDK as `@semoss/sdk/monolith` and `@semoss/sdk/monolith/<route>`)
and 2 (the `Env` → `ApiClient` bridge) are done. Do the rest in order, each as its own
change; the details and the gotchas are in [AGENTS.md](./AGENTS.md#integrating-into-the-sdk-and-the-apps).

- [ ] 3. Move the SDK's own calls (`libs/sdk/src/api/*`, the stores) onto the routes, keeping public signatures.
- [ ] 4. Add `useApi` to `@semoss/sdk/react` and replace the client's string-keyed `useAPI`.
- [ ] 5. Move the apps off `get` / `post` / raw `fetch` one module at a time, then delete `packages/client/src/api/` and `packages/automation/src/api/`.
- [ ] 6. Remove the SDK's `get` / `post` / `CSRF` / `HttpError`, the unused `partial` and `propagateUserPermissions`, and the thin wrappers; set the SDK version to the backend's.

## Trace unverified response shapes

Each of these has `@remarks Unverified …`. Trace the shape from the Java, tighten
the type and remove the remark.

- [ ] Microsoft directory rows: `getProjectUsersNoCredentials` (`api/auth/project.ts`, `api/auth/admin/project.ts`), `getEngineUsersNoCredentials` (`api/auth/engine.ts`, `api/auth/admin/engine.ts`), `getNonGroupMembers` (`api/auth/group.ts`, `api/auth/admin/group.ts`)
- [ ] `api/engine.ts`: `getPipeline` (`idMapping`, `pixelParsing`), `all` (keys beyond the typed ones), `agentRunStreaming` (`artifacts` items, `reviewOutcome`, `progress.workflow`)
- [ ] `api/engine/insight.ts`: `doMethod`
- [ ] `api/exec.ts` and `api/share.ts`: `getInsightState` `output`
- [ ] `api/project.ts`: `jdbc` (binary FST), `jdbcJson`, `jdbcJsonPost`
- [ ] `api/model.ts`: `llmStreaming` chunks
- [ ] `api/ext/mcp.ts`: `comms`. `api/ext/a2a.ts`: `agentCard`, `rpc`
- [ ] `api/auth/user.ts`: `deleteUser` (empty body today)
- [ ] `api/engine/legacy-engine.ts`: `insight`, `output`, `getAuditLogForEngine` (deprecated, low priority)

## Fix frontend types that disagree with the Java

- [ ] `libs/shared/src/types.ts` `Project`: `project_global` is a boolean and `group_permission` is a permission id (1, 2 or 3), not strings.
- [ ] `libs/sdk/src/api/permissions.ts` `getProjectUsersNoCredentials` / `getEngineUsersNoCredentials`: typed `User[]`, but the rows are `{ id, type, name?, email?, username? }`. Then drop the second cast in `libs/shared/src/components/members/add-members.tsx:243`.
- [ ] `libs/sdk/src/types.ts` agent-run types:
  - `PendingAgentAction`: the `T | null` fields arrive missing, not null.
  - `AgentRunSnapshot`: `roomId` is missing for runs delegated to a person, and `progress`, `artifacts`, `reviewOutcome` and `warnings` are not typed.
  - Tool item `name` and `arguments`: absent on Claude Code tool events.
  - Decide whether `AgentRunItem` gets a `progress` kind. The `agentRunStreaming` route sends `progress` items, so moving `AgentStore.watch` onto it (integration step 3) has to either type them or drop them.
- [ ] `packages/collaboration/src/features/rooms/api/agent-run-api.ts:86-89` (likely runtime bug): the zod tool item requires `name` and `arguments`, so `pollSchema.parse` (line 181) throws on a completed Claude Code tool call and breaks the poll.
- [ ] `libs/sdk/src/stores/insight/insight.store.ts`:
  - `askModel`, and `packages/playground/src/components/prompt/PromptOptimizer.tsx`, type `response` as a `string`. It is a tool-call list for `TOOL` and a map for `IMAGE` / `TTS`.
  - `queryDatabase` types the `Collect` output as a tuple. It is one object: `{ data: { values, headers, rawHeaders }, numCollected, taskId }`.
- [ ] `libs/sdk/src/api/access.ts`: `UsageNotApplied.limitType` should be `UsageBilledLimitType`. `UsageBilledTo` and `UsageLimitPathStep` say `id` / `type` are the team's, but for `DIRECT` and `ALL_MODELS` they are the person's.
- [ ] `packages/client/src/stores/config/config.store.ts` `RootConfig`: `availableProviders[].label` and `msGraphLookup` are always present, `version` can be missing, and `MetaKey.display_options` is nullable.
- [ ] `packages/client/src/api/ms-graph.ts` `MsGraphAvailability`: `notificationBaseUrl` is always present.
- [ ] Playground vector `listDocuments`:
  - `packages/playground/src/pages/knowledge-page.tsx` types `fileSize` as a `string`. It is a number, and `fileSize` / `lastModified` can be missing.
  - **Display bug:** `knowledge-detail-page.tsx` `parseSizeBytes` reads the KiB value as bytes, so sizes show 1024× too small. `packages/client/src/components/settings/file-table.tsx` gets this right.

## Add missing URL builders

- [ ] `api/project.ts` / `api/engine-route.ts`: add `projectImageDownloadUrl` / `imageDownloadUrl`. Then use them in `libs/shared/src/hooks/use-catalog-image.ts` and `packages/collaboration/src/features/agents/api/agent-image.ts`, which build the URL by hand. `agent-image.ts` also sends `fallback=false`, which Java ignores.
- [ ] `api/ext/mcp.ts`: add a `commsUrl` builder. `packages/client/src/components/shared/mcp-usage.tsx` builds the MCP URL by hand.

## Revisit wrappers that work around the backend

These wrappers work around backend behaviour. Change them when the backend changes.

- [ ] `api/auth.ts` `login`, `loginLDAP`, `loginLinOTP`, `logout`: these send `disableRedirect: true` by default, because otherwise the backend redirects to an HTML page.
- [ ] `api/session.ts` `invalidateSession`: always rejects (the backend always answers 302), and it clears the session in `.finally`.
- [ ] `api/themes.ts` `getAdminThemes`: `limit` and `offset` are required, because the backend throws without them.
- [ ] `api/ext/a2a.ts` `rpc`, `api/ext/mcp.ts` `comms`: these set `Accept` to choose which Java method runs.
- [ ] `api/function-engine.ts` `definition`: always fails with a 400 (misspelled reactor), and `required` is typed as the nested `[] | [string[]]`.
- [ ] `api/database.ts` `query`: returns the query struct, not rows. Callers use `runPixel` with `Collect`.
- [ ] `api/vector.ts` `query` (no `filters` / `metaFilters`) and `api/storage.ts` `deleteFromStorage` (no `leaveFolderStructure`): use pixels until the REST routes forward them.
- [ ] `api/engine.ts` `pixelJobStreaming`: the `stream_type` union lists only the known chunk types, because the backend has no contract for them.
- [ ] `api/project.ts` `jdbc*`: send `sql` in the request body of the POST variants, not in the query string, so long SQL isn't limited by URL length.

## Other follow-ups

- [ ] `packages/automation/src/components/canvas-editor/tabs/run-node-value-viewer.tsx`: imports `getAutomationRunNodeValue` from `src/api`, which never existed, and nothing imports the viewer. Implement it or delete it.
- [ ] `libs/sdk/src/api/chat.ts` `addRoomToolExecution` and `getUserRooms`: nothing in the repo uses them, but `libs/sdk/skills/sdk-chat/SKILL.md` documents them. Decide whether to remove them.
- [ ] `libs/sdk/skills/sdk-chat/SKILL.md` (~line 310): says `runAgent` has no `agentParams` parameter, but it now has one.
- [ ] `src/routes/api/project.ts` header (lines 12-14): says `{ error }` 401s leave `ApiError.message` as the status text. It now carries the `error` text.
- [ ] `libs/panels/src/types/access.types.ts:58`: the comment says N panels "cost one pixel", but the lookup is a REST call.
- [ ] `libs/sdk/src/js-frameworks/react/contexts/Insight.context.tsx:8`: imports the package root barrel (`"../../.."`). Import from the defining files instead.
- [ ] Endless polling:
  - `libs/shared/src/components/notebook/notebook.tsx` stops polling the job's console only on `ProgressComplete`, `Streaming` or `Complete`. A job that ends `Error`, `Canceled` or `UnknownJob` is polled every second until the user interrupts.
  - `packages/automation/src/components/canvas-editor/automation-canvas.tsx` polls job streaming forever while it returns `UnknownJob`.
- [ ] `automation-canvas.tsx` `AutomationNodeStreamData`: once it reads `pixelJobStreaming` (integration step 5), derive it from the route's `automation` chunk type instead of listing the fields by hand.
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
