# task.md — SDK room engine, `@semoss/chat` UI, `playground-desktop` (Tauri 2)

A completed-work record for three layered efforts, and the backlog that follows them:

1. **The SDK room engine** (`libs/sdk/src/stores/room/`): running a room is framework-free,
   so any surface can run rooms with the SDK alone. Every surface goes through the playground
   reactors (`CreatePlaygroundRoom`, `AskPlayground`, `GetPlaygroundMessages`,
   `AddPlaygroundToolExecution`, `GetPlaygroundRooms`).
2. **`@semoss/chat`** (`libs/chat`): the chat UI; `@semoss/playground` is a thin shell over it.
3. **`@semoss/playground-desktop`**: a Tauri 2 app composing both against any SEMOSS instance.

Where the result is documented: [libs/chat/AGENTS.md](libs/chat/AGENTS.md),
[packages/playground/AGENTS.md](packages/playground/AGENTS.md),
[packages/playground-desktop/AGENTS.md](packages/playground-desktop/AGENTS.md), the
[SDK guide](libs/sdk/AGENTS.md) and its packaged skills, and
[skills/chat-host.skill.md](skills/chat-host.skill.md).

**Root-wide verification (2026-11-05).** `pnpm check`: 1,024 diagnostics, all in 115 files this
work never touched (none in its 588 changed files). `pnpm test` (turbo, 17 packages): 13 pass;
client, collaboration, connectors and shared fail, and a clean worktree at `HEAD` fails the same
tests (shared 7, connectors 1, client 4, collaboration 49 + timeouts under parallel load; the one
extra collaboration failure in this tree passes 39/39 on solo re-runs). Live backend
(`localhost:9090/Monolith`): the playground boots on `@semoss/chat` (config 200, no failed
requests, no console errors) up to sign in; the desktop web bundle's instance picker validates
addresses and reports an unreachable server. The Rust side compiles cleanly
with Rust 1.99.1 / tauri-cli 2.12.4 (one fix: `reqwest` `.json()` → `serde_json`), its tests pass,
and `pnpm tauri:dev` launches the app. Still open: a signed-in chat lifecycle in the playground
and in the desktop window (no native UI automation here), and the hosted-backend export check.
Committed locally as `8a5e72b68` (not pushed).

**Status (2026-11-05).** Every task below landed on `feat/playground-desktop` (commit
`8a5e72b68`, local only). Verified: type-check and tests for
`@semoss/sdk` (401), `@semoss/chat` (266), `@semoss/playground` (13) and
`@semoss/playground-desktop` (21), Biome on the touched packages, and production builds of
playground and the desktop web bundle. **Not verified:** a signed-in run against a live backend
(the manual smoke matrices) — see the root-wide verification above. The full plan, with each task's goal, files,
acceptance criteria and the architecture it refers to (§ numbers in the notes below), is kept in
[task.full-plan.md](task.full-plan.md).

### Validation record (2026-11-05)

Checked against `feat/playground-desktop` @ `28b714799` and the Semoss backend source:

- **Playground reactors only.** Every surface — playground, desktop, embedded widget,
  terminal agent — goes through the playground reactors: `CreatePlaygroundRoom`,
  `AskPlayground`, `GetPlaygroundMessages`, `AddPlaygroundToolExecution`,
  `GetPlaygroundRooms`. There is no reactor-set parameterization (the earlier
  `ChatReactorSet` / `GENERIC_ROOM_REACTORS` design is dropped). Backend verified in
  `prerna/playground/reactors/`: `AskPlaygroundReactor extends AskRoomReactor` and
  `AddPlaygroundToolExecutionReactor extends AddToolExecutionReactor` (playground project-id
  override only); `CreatePlaygroundRoomReactor` and `GetPlaygroundRoomsReactor` add an
  optional `mode` (`collaboration` picks the collaboration system project) and
  `GetPlaygroundRooms` inherits every `GetUserConversationRooms` key (`limit`, `offset`,
  `search`, `sort`, `pinned`, `roomOptionsSearch`, `includeUnnamedRooms`,
  `includeChildRooms`) — so room scoping works on the playground reactors too.
- `AskRoom`/`AskPlayground` keys are `engine, roomId, parentMessageId, command, media, url,
  paramValues, responseParts, hiddenMessage` — no `context`/`image` (the SDK's legacy
  `askRoom` sends both; the gap closes when 1.1 replaces it). `GenerateRoomName(roomId,
  prompt, engine)` and `SubmitLlmFeedback(roomId, messageId, feedbackText, rating)` exist.
- No `libs/chat/` leftovers exist (task 2.1's "replace stale leftovers" is moot).
- `packages/collaboration` does **not** consume the SDK room wrappers — it has its own
  `pixel("CreatePlaygroundRoom", …)` / `GetPlaygroundMessages` api modules (task 1.5 audit).
  The SDK room surface's only in-repo consumer is the playground.
- Baseline: SDK 307/307 tests green; playground 326/328 — the 2 failures
  (`features/agents/workspace-edit.test.tsx`) come from `edit-workspace-page.tsx` reading
  `useInsight().system` without a provider, fixed by task 0.1. A stale `node_modules`/SDK
  `dist` needed `pnpm install --frozen-lockfile` + `pnpm --filter @semoss/sdk build` first.
- `@semoss/shared` has 7 pre-existing test failures (`entity-header`, `audit-logs-data-table`,
  `file-explorer-item`) unrelated to this effort — reproduced with the effort's changes stashed.
- Prior-art commits `704c4ed84` (Tauri) and `8c3b17190` (local-fs) are present locally.
- No Rust toolchain was on this machine at validation time; Rust 1.99.1 and tauri-cli 2.12.4
  were installed afterwards (see the root-wide verification above).

---

## Completed work

### Phase 0 — Rationalize in place

#### [x] 0.1 Migrate playground onto `Session`/`Config`
- **Landed** (working tree, uncommitted): `main.tsx` starts `Session.initialize()`; the
  app-level `<InsightProvider>` is gone; layouts gate on `useConfig`/`useSession`; the login
  page uses the new shared `SessionLoginForm` (`LoginForm` split into `LoginFormFields` +
  insight/session wrappers so collaboration/auditlog keep theirs); `ChatStore` lost
  `getUser`/`user`/`profileDefaultModelId`/`refreshProfileDefaultModel` (profile default from
  `useSession`, re-read via `Session.reloadUser()`); room-less pixels run through
  `Session.insight` (`utility/run-session-pixel.ts`, `useSessionPixel`, `useSessionInsight`).
  Playground 328/328 (the 2 baseline failures fixed), type-check clean. Manual login against a
  backend not run here.

#### [x] 0.2 Pull every pixel string into api modules (staging for the SDK)
- **Landed** (working tree): folded straight into the SDK (1.1's target) instead of staging a
  playground `src/api/` — the playground guide forbids an `api` folder, and the move would have
  been mechanical anyway. `libs/sdk/src/api/chat-pixels.ts` (`chatPixels.*` builders, byte-for-
  byte the playground's former strings) + runners in `api/chat.ts`; every playground room pixel
  (`AskPlayground`, `AddPlaygroundToolExecution`, `CreatePlaygroundRoom`,
  `GetPlaygroundMessages`, `GetRoomOptions`/`SetRoomForInsight`/`UpdateRoomOptions`,
  `RemoveUserRoom`, `RenameRoom`, `PinRoom`, `StopPixelExecution`, `SubmitLlmFeedback`,
  `ToDocx`/`ToPdf`, `CompactRoomMessages`, `DropInsight`) now comes from them. The task's
  acceptance grep (`"Playground("`) only matches `AskPlayground(`; the broader check — no
  room-reactor template string outside the SDK — also passes.

#### [x] 0.3 One rooms query
- **Landed** (working tree): `hooks/use-rooms-query.ts` (`useRoomsQuery({ search, pinned, limit,
  sort, enabled, includeOptimistic })` over `chatPixels.getRooms` in the session's insight,
  re-reading — rows kept — when `ChatStore.roomsVersion` moves; folds the optimistic-room merge
  and housekeeping). `keys.roomCounter` → `roomsVersion` + `bumpRoomsVersion()`. Global nav,
  chats page, agent chat list (pin via `chat.pinRoom`) and room actions all use it; tests in
  `use-rooms-query.test.tsx`. (`offset` is driven by paging, not a caller option.)

#### [x] 0.4 SDK fixes (three small changes to `libs/sdk`)
- **Landed** (working tree): A — `getUserRooms` removed; `getPlaygroundRooms(insightId, { search,
  roomOptionsSearch, pinned, limit, offset, sort, mode })` lists through `GetPlaygroundRooms`
  (`api/chat.test.ts` pins the reactor name). B — `InsightWebSocket.buildUrl` derives
  `ws(s)://host/path` from an absolute `Env.MODULE` (`api/websocket.test.ts`, runs without a
  `window`). C — `setSignInWindowOpener(opener | null)` + `SignInWindow`/`SignInWindowRequest`
  in `api/auth.ts`; `connectLogin` and `oauth` open through it, default = the old popup
  (existing auth tests unchanged + 3 new). Skill docs updated with the 1.5 rewrite.

#### [x] 0.5 Split `RoomStore` into store + controllers (still MobX)
- **Landed** (working tree): done directly at the engine boundary instead of as a MobX
  intermediate (it would have been rewritten in 1.2–1.4 anyway). The old 1925-line
  `room.store.ts` is gone: engine-bound core → SDK `stores/room/room-engine.store.ts`
  (lifecycle, tree, ask/cancel, options save; ~1100 lines, ~40% TSDoc), with
  `room-options.ts` (stored-options diffing, `getStoredMcp`, workspace-mcp merge, turn
  context), `room-session.ts` (load+bind pixel, close), `room-compaction.ts`,
  `room-console.ts`, `message/message-tree.ts` (`linkMessageTree`) split out; UI-bound
  workbench/rail/file-mode/connectors → playground `features/workbench/room-ui.store.ts`
  (`RoomUiStore extends RoomEngine`). Uploads stay in the engine's `askMessage` (they are
  `uploadInsight` transport, not UI). Dock invariants covered by the unchanged
  `room-sidebar.test.ts` / `use-sidebar-panel-active.test.tsx` / new-room-page tests.

#### [x] 0.6 Trim `ChatStore` to rooms concerns
- **Landed** (working tree): agent CRUD → `features/agents/agents.api.ts`
  (`addWorkspace`/`createAgent`/`editWorkspace`/`deleteWorkspace`, session insight);
  `downloadConversation` → `features/room-actions/download-conversation.ts` over SDK
  `chatPixels.getMessages` + `exportMarkdown` (`formatConversation` tested); `embeddedPageMap`
  → `features/navigation/embedded-pages.ts` (`getEmbeddedPageMap(theme)`); model persistence
  behind `stores/chat/chat-preferences.ts` (`ChatPreferencesAdapter` +
  `createSessionStoragePreferences`, same storage key/format, storage failures tested).
  `chat.store.ts` 968 → ~630 lines: room cache/registry, create/load/close/rename/pin, model
  selection, optimistic rooms/`roomsVersion`.

#### [x] 0.7 Naming and structure conformance pass
- **Landed** (working tree): `components/prompt/PromptOptimizer.tsx` →
  `components/prompts/prompt-optimizer.tsx` (folder folded into `prompts/`);
  `components/room/room-input.tsx` → `room-composer.tsx` (`RoomInput` → `RoomComposer`);
  `contexts/{chat,root,tour,file-drag}-context.tsx` → `*.context.tsx`;
  `hooks/use-theme-title.tsx` → `.ts` (typed its param). Biome clean on playground/sdk/shared.

### Phase 1 — The SDK room engine

#### [x] 1.1 Reactor-set-parameterized chat api in the SDK
- **Landed** (working tree): `api/chat-pixels.ts` (`chatPixels.*` on the playground
  reactors — no reactor set) + runners in `api/chat.ts` (`createPlaygroundRoom`,
  `askPlayground`, `addPlaygroundToolExecution`, `getPlaygroundMessages`,
  `getPlaygroundRooms`, `removeUserRoom`, `renameRoom`, `pinRoom`, `generateRoomName`,
  `stopPixelExecution`, `submitLlmFeedback`, `exportMarkdown`) + `api/insight-assets.ts`.
  Removed: `createRoomRecord`, `getRoomMessages`, `askRoom`, `addRoomToolExecution`,
  `getUserRooms` and their types. Tests: `chat-pixels.test.ts`, `chat.test.ts`.

#### [x] 1.2 Convert playground stores to `Observable` in place (leaf → root)
- **Landed** (working tree): converted during the lift rather than in place (same end
  state, one rewrite instead of two). SDK `ObservableStore` (`stores/room/observable-store.ts`):
  each store owns a private `Observable` change counter; `observeFields` turns data fields
  into notifying accessors (the `makeObservable` role), `batchChanges` replaces
  `runInAction`, and messages/tool calls propagate their changes to their message/room.
  Streaming is copy-on-write per chunk (`savePart`/`appendPart`/`updateParts`); each message
  has its own Observable. All 62 `observer()` components now read through selector hooks
  (`useRoomSelector`, `useMessageSelector`, `useToolSelector`, `useToolsSelector`,
  `useStoresSelector`, `useRoomsClient`, `useObservableStore`); the conversation list is keyed
  by structure (`useHistoryEntries`) so a chunk re-renders only its message. The
  `ClientToolProvider` seam replaced `ChatToolsStore`'s folder hard-wiring
  (`createChatFilesToolProvider`, plus the playground's decorate-only
  `createConnectorToolProvider`). DOM-free: no `window`/`document` in engine code. Streaming
  perf not profiled in a browser here.

#### [x] 1.3 Lift the engine into `libs/sdk`
- **Landed** (working tree): `libs/sdk/src/stores/room/` — `room-engine.store.ts`
  (`RoomEngine<O>`, hooks `onInsightBound`/`refreshFiles`/`showToolPanel`/`hideToolPanel`,
  `send()`/`waitForIdle()` for viewless hosts), `rooms-client.store.ts` (`RoomsClient<R>`,
  `ChatPreferencesAdapter`, `listRooms` with `roomScope`, `autoNameRooms`),
  `room-engine-config.ts` (`RoomEngineConfig`: `appName`, `roomScope`, `instructions`,
  `turnContext`, `runParams`, `clientTools`, `toolAutoExecutionLimit`, `sendTemperature`,
  `allowedFileTypes`, `defaultRoomSettings`, `autoNameRooms`, `onPendingAction`), message
  stores + `agent-harness.ts` (reconnection + `onPendingAction` auto-decisions),
  `tool-call.store.ts`, `stream-job-controller.ts`, `context-items.store.ts`,
  `room-tool-file.ts`, `room-session.ts`, `chat-tools/` (provider seam, chat-files provider,
  folder tools), `room.types.ts`, `room.constants.ts`. Old SDK `RoomStore`/`createRoom` deleted;
  `InsightStore.actions.getRoom()` returns a loaded `RoomEngine`. React hooks in
  `js-frameworks/react/hooks/use-room.ts`. Engine tests run in Node (`environment: "node"`):
  `room-engine.store.test.ts`, `rooms-client.store.test.ts`, moved agent-harness /
  attachments / tool-file / chat-tools / context-items tests. SDK 398 tests, both entries
  build. Manual smoke against a backend not run here.

#### [x] 1.4 Playground consumes the engine
- **Landed** (working tree): `packages/playground/src/stores/` deleted; `ChatStore` →
  `host/playground-rooms-client.ts` (`createPlaygroundRoomsClient`, a `RoomsClient<RoomUiStore>`
  wired from the theme via `RoomUiStore.buildEngineConfig`); theme store →
  `host/root.store.ts`; preferences → `host/session-preferences.ts`; `constants.ts` removed
  and message types re-exported from the SDK in `types.d.ts`. Playground 274 tests (47 moved
  into the SDK), type-check and Biome clean.

#### [x] 1.5 Major-release audit, migration notes, and engine documentation
- **Landed** (working tree): audit — no package outside the SDK and playground used the
  removed surface (`createRoomRecord`, `askRoom`, `addRoomToolExecution`, `getUserRooms`,
  `getRoomMessages`, `RoomStore`, `createRoom`, their types); collaboration/client/terminal/cli
  have their own room modules. Every consumer type-checks with no SDK-related error
  (client/terminal/automation/connectors/auditlog carry pre-existing, unrelated errors).
  `libs/sdk/MIGRATION.md` (old → new map, recipes; shipped in `files`), version
  `2.0.0-beta.0`, SDK AGENTS.md "Chat and Agent Ownership" rewritten around the engine,
  packaged `skills/sdk-chat/SKILL.md` rewritten (engine, config, observing, client tools,
  builders/runners, chat jobs; agent-run sections kept), flat `skills/sdk-chat.skill.md`
  route updated. External: `mde4vets-chat` pins `1.0.0-beta.47`; migrates when rebuilt (Phase 7).

#### [x] 1.6 Remove MobX
- **Landed** (working tree): `mobx`/`mobx-react-lite` dropped from
  `packages/playground/package.json` (lockfile updated by `pnpm install`); `RootStore` is a
  plain class (the theme is set once); tests no longer use `runInAction`/`observable`
  (`src/testing/observable-fake.ts` gives plain test doubles the store interface). The
  acceptance grep returns nothing.

### Phase 2 — `libs/chat`: the UI layer

#### [x] 2.1 Scaffold `@semoss/chat` + host contract
- **Landed** (working tree): `libs/chat` per the connectors conventions (source-only, `exports`
  `.`/`./connectors`/`./globals.css`, `sideEffects`, tsconfig, `vitest.config.ts` +
  `vitest.setup.ts`); `@semoss/connectors` is an optional peer (dev dependency for tests),
  `@semoss/panels` a dev dependency only. `host/chat-host-config.ts` (`ChatHostConfig`, every field
  TSDoc'd; also `defaultModel`, `defaultTools`, `defaultTemperature`, `fileDragDisclaimer`,
  `defaultEmbedderId`, `platformUrl`, `filePanels`, `slashCommands`), `chat.context.tsx`
  (`ChatProvider` makes and initializes the rooms client, wraps children in `@semoss/ui`'s new
  `PortalContainerProvider`; `useChat()` → `{ config, chat }`), `chat-rooms-client.ts`,
  `room-integration.ts`, `preferences-adapter.ts` (the session-storage adapter). Playground's
  `src/host/build-playground-host-config.ts` replaces `createPlaygroundRoomsClient` and the
  theme threading into stores; `MainLayout` mounts `<ChatProvider config>`. `pnpm --filter
  @semoss/chat test` runs (262 tests). AGENTS stub superseded by 3.1.

#### [x] 2.2 Move the room UI
- **Landed** (working tree): 249 files moved with history (`git mv`) and imports rewritten:
  `features/{composer,conversation,workbench(+panels),room-header,room-actions,suggestions,
  tool-views,tool-inspector,chat-tools-ui,draft-room}`, `components/{message,mcp,lexical,
  file-preview}`, `contexts/`, `hooks/`. `RoomUiStore` takes `host: ChatHostConfig` (no theme);
  `ROOM_PANEL_COMPONENTS` is now only the room's four panels — the host composes file panels and
  connector viewers (`PLAYGROUND_PANEL_COMPONENTS`). No react-router in libs/chat: `RoomLink`
  (`getRoomHref` + `onOpenRoom`), `config.navigation.*` everywhere; the room header takes a
  `leading` slot (playground's `PageHeaderNavigation`). Overlays honour `portalContainer` (all 11
  Radix portals in `@semoss/ui/next` read `usePortalContainer`). No dock without
  `panelComponents` (header toggle and Workspace menu hidden; tested). Slash menu takes host
  commands (`slashCommands`). Page bodies became views: `RoomView`, `NewRoomView` (draft room;
  brand via `banner`/`background`/`welcome`/`description` slots). `pages/new-room-page.tsx` and
  `pages/room-page.tsx` are thin. Deviation: the composer's plus menu is not host-extensible yet
  (slash menu is). Manual backend smoke (/new → message → tool → Files → export) not run here.

#### [x] 2.3 Move the page-level surfaces
- **Landed** (working tree): `features/rooms-list/` (`RoomsListView`, `ChatRow`, `useRoomsQuery`),
  `features/agents/` (`AgentCatalogView`, `AgentDetailView`, `AgentEditView`, `AgentNewView`,
  cards, `agents.api.ts`), `features/knowledge/` (`KnowledgeView`, `KnowledgeDetailView`),
  `features/prompts/`, `features/settings/` (dialog with host `pages`). Every `pages/*` is a thin
  route file; `components/common/` holds only brand chrome (+ `ThemeBanner`). Message feedback
  already ships inside `ResponseMessage` (thumbs, `enableFeedbackText`, SDK
  `SubmitLlmFeedback`), so no separate `features/feedback/` was split out.

#### [x] 2.4 i18n: split the chat namespace
- **Landed** (working tree): `locales/<lng>/chat/` (room, chat, knowledge, workspace, tool, mcp,
  chat-tools, chat-connectors, sidebar) for all seven locales; `chatResources` (chat + the core and
  shared namespaces it reads); `playgroundResources = chatResources + appNav/tour/mobile`. The
  playground-only sidebar keys (`nav`, `userMenu`, `search`, `takeTour`) moved to
  `playground/app-nav.json`. Static check: every `ns:key` literal in chat + playground resolves;
  all locales at key parity (13 pre-existing gaps filled: `sidebar.actions.download` ×6, es
  compaction ×4, nl permissions ×3). Visual en/ar render not checked in a browser here.

#### [x] 2.5 Connectors glue → `@semoss/chat/connectors`
- **Landed** (working tree): `src/connectors/` exports `createConnectorsIntegration()`,
  `CONNECTOR_PANEL_COMPONENTS` (+ `CONNECTOR_PANEL_TYPES`), `CONNECTORS_SETTINGS_PAGE`,
  `ConnectorsSettingsView`, `createConnectorToolProvider`, `getRoomConnectors`. The core reaches
  connectors only through `RoomIntegration` (draft prepare/adopt/restore, rail panels, busy +
  suggestion context, context-item icons, tool-call ownership/presentation + sign-in notice,
  tool-view sign in, settings page, composer notice, settings section); "Manage connectors" goes
  through `useOpenSettings` (`config.onOpenSettings`, else the chat's settings dialog). Grep:
  no runtime `connectors/`, `@semoss/connectors` or `@semoss/panels` import in core sources.

#### [x] 2.6 Thin-shell audit of playground
- **Landed** (working tree): `packages/playground/src` = `pages/`, `host/`, brand chrome
  (`components/common/`, `features/navigation/`), `contexts/`+`hooks/` for theme/tour, `app.tsx`,
  `main.tsx`, assets. `lexical`, `@lexical/react`, `mermaid` dropped (lockfile via `pnpm
  install`); `src/index.css` imports `@semoss/chat/globals.css`. Playground test (13), type-check,
  Biome and production `pnpm build` pass. Full manual smoke not run (no backend here).

#### [x] 2.7 Collaboration cross-check (read-only)
- **Landed** (working tree): gaps recorded in `libs/chat/AGENTS.md` ("Collaboration
  cross-check"): no engine `roomMode` (collaboration creates/lists with `mode: "collaboration"`),
  own pixel/zod transport, own room session, own agent-turn controller, own options/name/model/
  upload handling, Brain topics/threads (a future integration), own composer. Phase 7 entry
  updated. No collaboration changes.

#### [x] 2.8 Selector-hook/API polish
- **Landed** (working tree): `src/index.ts` curates the public surface (host contract, UI store +
  contexts, building blocks, views, settings, types); named exports only; every barrel export has
  TSDoc (scripted check); no deep imports needed by playground; Biome clean.

### Phase 3 — Documentation

#### [x] 3.1 `libs/chat/AGENTS.md`
- **Landed** (working tree): boundary (owns/refuses), structure, the seams with examples
  (`ChatHostConfig`/`ChatProvider`, `RoomIntegration` table), glossary, the migrated invariants
  (Workspace, chat tools, slash menu, tool views, context items, connectors subpath, agent forms),
  translations, the collaboration gaps, testing.

#### [x] 3.2 Rewrite `packages/playground/AGENTS.md`
- **Landed** (working tree): thin-shell description, how the shell is wired (theme → config,
  panels, connectors, navigation, styles, translations), pointers into `libs/chat/AGENTS.md` and
  the SDK guides; build/env/test sections kept.

#### [x] 3.3 Root docs
- **Landed** (working tree): root `AGENTS.md` lists `@semoss/chat` (summaries, layering, workspace
  tree, nested guides, host wiring note), the SDK room engine in the SDK summary, and the
  chat-host skill.

#### [x] 3.4 `skills/chat-host.skill.md` (new)
- **Landed** (working tree): SDK-only and React recipes, Workspace/file panels, client tools and
  integrations, minimal bundles and Shadow DOM, verification; indexed in `skills/README.md`.

### Phase 4 — `packages/playground-desktop` (Tauri 2)

#### [x] 4.1 Scaffold the app
- **Landed** (working tree, partly verified): `packages/playground-desktop` (package.json with the
  listed workspace deps and **no Tauri npm packages** — `app.withGlobalTauri` exposes the API on
  `window.__TAURI__`, typed in `src/platform/tauri.ts`), `vite.config.ts` (panels' `aiSdkStubAlias`
  + `scopePptxViewerCssPlugin` + monaco alias), `index.html`, `src/main.tsx` + `src/app.tsx`
  (`Session.initialize()` only once an instance is in use), `src/index.css` (all six globals),
  `src-tauri/` (`Cargo.toml`, `build.rs`, `tauri.conf.json` with CSP, `capabilities/default.json`,
  icons from `704c4ed84`, `src/lib.rs` command registry). `DEV_SERVER_PORTS.playgroundDesktop =
  5181`; root `pnpm dev:desktop`; root AGENTS.md entry. Web bundle type-checks, tests and builds;
  the Rust side compiles and `pnpm tauri:dev` launches the app (see the root-wide verification).

#### [x] 4.2 Native fetch bridge + SDK host wiring
- **Landed** (working tree): `src/platform/fetch-bridge.ts` (every body — string, form, Blob,
  `FormData` multipart — encoded via `new Response(body)` and sent base64; base64 responses, so
  binary downloads survive; 6 tests incl. multipart and binary), `sdk-host.ts` (Rust told the
  instance first via `set_active_instance`, absolute `Env.MODULE`; CSRF from `Config.load`).
  `lib.rs` `native_http_request` ports `704c4ed84` (cookie sync with the webview jar) with a
  runtime active-instance allowlist (origin + module path), base64 bodies both ways, `authorization`
  / `bearer-provider` allowed for bearer sessions. Compiled and signed in against `localhost:9090/Monolith`; not run against a hosted instance.

#### [x] 4.3 Instance picker + preferences
- **Landed** (working tree): `InstanceStore` (Observable; validated reads; persisted through
  `tauri-plugin-store` `preferences.json`, memory outside the shell; 5 tests),
  `instance-picker-page.tsx` + `instance-form.tsx` (URL + module defaulting `/Monolith`, checked
  through `check_instance` before saving), desktop `ChatPreferencesAdapter` (per-instance model in
  the same file). **Switching instances reloads the webview** (documented in the package guide).

#### [x] 4.4 Login: every method + bearer tokens + keychain
- **Landed** (working tree): `login-page.tsx` — `SessionLoginForm` (native/LDAP/OTP/OAuth from the
  config's providers) plus a bearer-token tab (`Env.BEARER_TOKEN`/`BEARER_PROVIDER` +
  `Session.refresh()`, refused tokens shown inline, "Remember" → keychain). OAuth and connector sign
  ins use `setSignInWindowOpener` with Rust-built `semoss-auth-*` windows (no capability) that emit
  navigation/close events. Keychain: `secret_get/set/delete` over `keyring` (service
  `semoss-desktop`); sign out deletes a remembered token. Not exercised against a backend.

#### [x] 4.5 Chat shell composition
- **Landed** (working tree): `DesktopLayout` mounts `<ChatProvider config={buildDesktopHostConfig}>`
  (the instance's playground theme for flags/limits; client tools = chat files + connectors +
  desktop; integrations = connectors + desktop tools + desktop panels; panels = files + room +
  connectors + browser) and `SettingsDialogProvider` with the Connectors page; hash routes for
  `/new`, `/room/:id`, `/chats`, `/agent…`, `/knowledge…` render `@semoss/chat` views; a narrow
  desktop nav. Type-check + host-config tests pass; the manual lifecycle matrix was not run.

#### [x] 4.6 Downloads and exports through the bridge
- **Landed** (working tree): SDK seam `setDownloadHandler` (`api/file.ts`, 3 tests, SDK guide);
  `downloads.ts` reads the file through the bridge and Rust `save_file_with_dialog` asks where to
  save (the page never picks a path). Not exercised end to end.

#### [x] 4.7 `packages/playground-desktop/AGENTS.md`
- **Landed** (working tree): boundary and structure, how the bridge/sign in/downloads/composition
  work, hard security rules (keychain-only secrets, instance allowlist, invoke surface, CSP, ask
  for disk), Rust toolchain setup, dev/build workflow, release steps, verification status.

### Phase 5 — Desktop extensions

#### [x] 5.1 Desktop tools (`desktop-tools` feature)
- **Landed** (working tree): `createDesktopToolProvider()` (`desktop_notify` auto, `desktop_open_path`
  ask — reveals, never opens; 4 tests) + `createDesktopToolsIntegration()` so calls get the chat tool
  card; `ChatToolCard` now approves any client tool call locally (`room.chatTools.canRun`), not only
  folder calls. Rust `desktop_notify` / `desktop_reveal_path`. Agent mode via `onPendingAction` is
  documented, not wired. The end-to-end model turn was not run.

#### [x] 5.2 Desktop panels (browser panel first)
- **Landed** (working tree): `BrowserPanel` (keepAlive iframe, sandboxed, http(s)-only address bar,
  address in the panel config so it is per room and survives close/reopen; URL test) and
  `createDesktopPanelsIntegration()` (rail + Open a Panel); CSP `frame-src https:`. Framing-refusing
  sites documented. v2 (child webviews) left in the backlog.
- **Removed (2026-11-06)**: the browser panel and its integration are gone; the Workspace offers
  only the file, room and connector panels. CSP `frame-src` stays for MCP tool views. Links open
  in the user's browser instead (`on_new_window` in `lib.rs`).

#### [x] 5.3 Packaging
- **Partly landed** (working tree): `tauri:build` script, bundle config and icons, version wiring
  and release steps (signing/notarization variables) in the package guide. No artifact was built
  (no Rust toolchain here).

### Phase 6 — Cleanup, deduplication and standardization

#### [x] 6.1 Deduplication sweep
- **Landed** (working tree). Sweep log — merged: `runSessionPixel` (SDK private copy + chat
  utility → one SDK export); the stored-model validator (two adapters → SDK
  `parseSelectedModelPreference`); `TOOL_VIEW_LIBRARIES` (two host copies →
  `CONNECTOR_TOOL_VIEW_LIBRARIES` in `@semoss/chat/connectors`); file-panel wiring (two hosts + test
  fixtures → `@semoss/chat/panels`: `CHAT_FILE_PANELS`, `CHAT_FILE_PANEL_COMPONENTS`); the
  theme→chat mapping (two hosts → `chatSettingsFromTheme`, which also restores playground's
  default tools and default temperature, dropped in 2.1); `LanguageDirection` (shared from
  `@semoss/chat`); the dark-mode check (three playground pages → `useIsDarkMode`). Deliberately
  left: `insightAssetPixels` (SDK) vs the shared explorer's INSIGHT adapter — the SDK cannot depend
  on shared and the generic adapter refactor is out of scope; the session-storage vs desktop
  preference adapters (different stores). Root-wide `pnpm test`/`pnpm check` not run (pre-existing
  failures in untouched packages); manual smoke not run.

#### [x] 6.2 React-standard conformance audit
- **Landed** (working tree): new and moved code reviewed against the standard — one component per
  file (a wrapper split was replaced by `requireRoomConnectors`), hooks with typed returns
  (`useOpenSettings`, `useRoomFileHost`, `useRoomToolViewHost`, `useIsDarkMode`), effects with
  complete deps (agent/knowledge redirects), TSDoc on every public export, forms per the form
  skill (instance, bearer token), a11y spot checks (labelled controls, `useId` labels, nav label,
  frame title, icon-button names). Biome clean for chat, playground, playground-desktop, i18n;
  the only suppressions are pre-existing ones carried with moved code. Waived: `Props` types stay
  exported by convention.

#### [x] 6.3 Dead code and dependency pruning
- **Landed** (working tree): removed dead exports (per-viewer panel constants, `findConnectorSource`,
  two folder-label helpers, `ProjectDependency`), the chat runner copy, host tool-view copies and
  playground's `contexts/`/`hooks/` barrels; lexical/mermaid only in `libs/chat` among these
  packages; `@semoss/connectors` only in hosts that wire it (their stylesheet) and the chat's
  optional peer; mobx remains only in `libs/renderer`, `client` and `auditlog` (not part of this
  effort). `src/package-boundaries.test.ts` proves the chat core compiles without
  connectors/panels/router (and was shown to fail on a probe import); SDK engine tests run in Node.
  `turbo.json` unchanged (source-only libs have no build script).

#### [x] 6.4 Public API tightening
- **Landed** (working tree): intentional-export lists in `libs/chat/AGENTS.md` (three entries) and
  the SDK guide (host seams); the chat barrel matches the host skill; subpath boundaries enforced
  by the boundary test; SDK React entry exports hooks only (selector cache internal). Type-check
  passes for sdk, chat, playground, playground-desktop.

#### [x] 6.5 Documentation re-verification
- **Landed** (working tree): the chat, playground, desktop, SDK and root guides and the chat-host
  skill re-read against the final source; a scripted check found every named file and symbol (its
  only hits were server asset paths, collaboration files and env-var names). This file is pruned
  to the completed-work record below.

---

## Phase 7 — Future hosts and deferred work (backlog, ordered by value)

- [ ] **Embedded webpage chat** (`packages/embedded-chat`) — rebuild the `mde4vets-chat`
  widget pattern on the SDK engine: keep its good ideas (plain-DOM launcher shell + lazy
  React chunk, Shadow DOM with injected CSS and `portalContainer`, push-layout +
  resize/compact modes, CSS-custom-property theming with `data-theme` palettes and brand
  slots, imperative `open/close/setConfig/destroy` API, per-origin width/palette
  persistence) and drop its hand-rolled engine (§2.6 errors). Engine config:
  the playground reactors (as every surface), `roomScope`, `turnContext` (pageContext),
  `runParams`, `onPendingAction` for DOM-capture tools, `autoNameRooms`, feedback on.
  Auth: existing cookie session **or** the SDK's embed/bearer path. Optionally offer
  mde4vets a migration.
- [ ] **Terminal agent (CLI)** — the SDK-only proof: a small `packages/`- or external CLI
  that signs in with a bearer token (`Env.HEADLESS`), creates a scoped room, runs agent
  turns with approvals on stdin, prints streamed output. No React, no DOM — validates the
  engine's Node constraint end-to-end.
- [ ] **Chrome extension chat** — reuse `packages/chrome-extension` scaffolding; MV3
  service-worker constraints; no popups → the 0.4 opener seam again; `turnContext` carries
  the active tab.
- [ ] **Mobile** — Tauri 2 iOS/Android from the desktop package vs. a separate host; decide
  after desktop ships ([skills/mobile-development.skill.md](skills/mobile-development.skill.md) applies).
- [ ] **Collaboration adoption** — act on the 2.7 gap notes (`libs/chat/AGENTS.md`): first add an
  engine `roomMode` for `CreatePlaygroundRoom`/`GetPlaygroundRooms`, then move its transport, room
  session and agent turns onto the engine, and its Brain topics into a `RoomIntegration`.
- [ ] **Composer simplification** — `room-composer.tsx` (1218 lines) decomposition; moved
  wholesale on purpose to keep the extraction reviewable.
- [ ] **Connectors promotion** — if a third host wants connectors, promote
  `@semoss/chat/connectors` to its own package; the subpath boundary makes this cheap.
- [ ] **Voice dictation** — optional composer extension (mde4vets pattern: 16 kHz WAV
  upload + `LLM(..., useHistory=false)` with media against a transcription model engine).
- [ ] **Desktop tool catalog** — local-fs tools with allowlist + path guard.

---

## Standards appendix (read before picking up any task)

- **Always**: [skills/react-standard.skill.md](skills/react-standard.skill.md) — features
  layout (`src/features/<feature>/`), named exports, curated entry points + defining-file
  imports inside a package, hooks pattern, fold-single-use-pieces, kebab-case + role-suffix
  naming (`*.store.ts`, `*.context.tsx`, `use-*.ts`), SDK transport in `api/` modules,
  TSDoc on public contracts, no `any`/non-null assertions.
- **SDK work**: [libs/sdk/AGENTS.md](libs/sdk/AGENTS.md) — published package, no runtime
  deps, framework-agnostic core, React only under `js-frameworks/react`, both entries must
  build, packaged skills updated in the same change as any API they describe.
- **Session/insight work**: [libs/sdk/skills/session.skill.md](libs/sdk/skills/session.skill.md) —
  `Session`/`Config` ownership, where a pixel runs (`useSessionPixel` vs `useInsightPixel`
  vs `Session.insight`), the deprecation table.
- **Room/agent work**: [libs/sdk/skills/sdk-chat/SKILL.md](libs/sdk/skills/sdk-chat/SKILL.md) —
  two transports (AskRoom jobs vs RunAgent polling, never cross them), watcher lifecycle,
  approval rules, polling deadlines.
- **UI**: [DESIGN.md](DESIGN.md) + [skills/accessibility.skill.md](skills/accessibility.skill.md);
  forms via [skills/react-form-builder.skill.md](skills/react-form-builder.skill.md).
- **Validation per task**: `pnpm --filter <pkg> test`, `pnpm --filter <pkg> type-check`
  (apps) / `check-types` (libs), `pnpm check` (biome), plus each task's manual smoke.
- **Do not touch**: `pnpm-lock.yaml` by hand, `pom.xml`, `*.local` env files, committed
  proxy targets; be cautious with `turbo.json`, `biome.json`, root `package.json`.
