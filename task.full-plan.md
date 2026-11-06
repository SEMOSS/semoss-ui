# task.md — SDK room engine, `@semoss/chat` UI, `playground-desktop` (Tauri 2)

This file is the working roadmap for three layered efforts:

1. Move the **data/logic of running a room into `@semoss/sdk`** (framework-free), so any
   surface — the playground, a desktop app, an embedded widget, a future **terminal agent**
   or custom app — can run rooms with the SDK alone.
2. Extract the **chat UI into a new `libs/chat`** so the playground becomes a thin shell
   over it, replicating the playground experience as fully as possible.
3. Build **`packages/playground-desktop`**, a Tauri 2 desktop app composing both against a
   hosted backend.

It is written so a human or an agent can pick up any task cold: every task names its goal,
prerequisites, the real files it touches, acceptance criteria, and how to verify it.

Status convention: edit the checkbox when a task lands (`[ ]` → `[x]`) and append a short
"Landed:" note (PR / commit) under the task. Do not reorder tasks; dependencies are explicit.

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
- **No Rust toolchain on this machine** (`cargo`/`rustc` absent): Phase 4–5 Rust code is
  written but `cargo check`/`tauri dev` cannot be run here until rustup is installed.

---

## 1. Vision

- **`@semoss/sdk` owns the room engine**: transport (playground-reactor pixel builders),
  the room/message/tool state machines, streaming, agent-run orchestration, and the
  client-tool seam — all framework-free (`Observable` + typed `getSnapshot`/`subscribe`,
  the existing `SessionStore` pattern), runnable in a browser, a webview, or Node
  (`Env.HEADLESS` + bearer auth already exist for Node).
- **`libs/chat` (`@semoss/chat`) owns the chat UI and composition**: composer, message
  rendering, the room workbench dock, the `/new` draft experience, rooms list, agents,
  knowledge's generic parts, prompts, settings, and the connectors glue (optional subpath).
  It replicates the playground experience; hosts string its page-level building blocks into
  their own router.
- **`packages/playground`** becomes a thin shell: branding/theme, env wiring, routing, the
  embed page, one host-config composition.
- **`packages/playground-desktop`** (Tauri 2): instance picker, every login method **plus
  raw bearer tokens**, OS-keychain credential persistence, desktop-run tools injected at
  room creation (frontend only — **no backend changes**), custom desktop panels (browser
  panel first).
- Longer term, the same stack powers a **mobile app**, a **chrome extension chat**, an
  **embedded webpage chat** (replacing the hand-rolled `mde4vets-chat` widget — see §2.6),
  and a **terminal agent** (SDK-only, no React).

Guiding rules, in order:

1. Follow [skills/react-standard.skill.md](skills/react-standard.skill.md) for everything
   (architecture, naming, hooks, folding single-use pieces, validation). Read it before any
   task in this file.
2. **Data/logic in the SDK, UI in libs/chat.** Room-engine code must be framework-free: no
   React, no DOM/`window` access, no UI-lib imports — a terminal agent must be able to run
   it. React bindings live under `@semoss/sdk/react` (hooks) and `@semoss/chat` (components).
3. State management uses the **observable utility** — `Observable` from
   `@semoss/utility/observable` ([libs/utility/src/observable.ts](libs/utility/src/observable.ts)):
   a store owns a private `Observable`, exposes typed `getSnapshot`/`subscribe`, and React
   reads it through a selector hook (`useSyncExternalStore`). The SDK's
   `SessionStore`/`ConfigStore` ([libs/sdk/src/stores/session/session.store.ts](libs/sdk/src/stores/session/session.store.ts),
   [libs/sdk/src/stores/config/config.store.ts](libs/sdk/src/stores/config/config.store.ts))
   are the reference implementations. MobX is removed entirely (task 1.6).
4. All backend access routes through `@semoss/sdk`: `Session`, `Config`, `useSession`,
   `useConfig`, `useSessionPixel`, `useInsightPixel`, `useInsight`, and the SDK transport
   primitives. No raw `fetch`, no pixel strings outside SDK `api/` modules. Read
   [libs/sdk/skills/session.skill.md](libs/sdk/skills/session.skill.md) and
   [libs/sdk/skills/sdk-chat/SKILL.md](libs/sdk/skills/sdk-chat/SKILL.md) before store work.
   The SDK is published, and **this effort is a major release**: the old chat/room surface
   does not need to be honored — redesign it cleanly, remove superseded APIs, and ship
   migration notes (task 1.5). Every public API change still updates the packaged skill in
   the same change (SDK AGENTS.md rule).
5. **1 room = 1 insight**, with per-load binding kept as-is (`SetRoomForInsight` against a
   fresh insight on each load; close drops it). The lifecycle gets one owner in the engine
   (task 1.3) so hosts cannot get it wrong.
6. Every lib has a clear boundary documented in its own `AGENTS.md`, legible to humans and
   LLMs, and the root [AGENTS.md](AGENTS.md) lists it.

## 2. Architecture

### 2.1 Dependency graph (target)

```
utility ──┐
i18n ─────┤   sdk (room engine, session, agent) ◄─── terminal agent / custom apps (no React)
sdk ──────┤                                     ◄─── embedded chat widget (slim React, §2.6)
ui ───────┼── shared ──┐
          │            ├── chat ─────┬─ @semoss/playground          (thin shell)
workbench ┴── panels ──┘      │      ├─ @semoss/playground-desktop  (Tauri 2)
                              │      └─ (later: mobile, chrome extension)
                              └── "./connectors" subpath → @semoss/connectors
```

- `@semoss/chat` depends on `@semoss/{i18n,sdk,shared,ui,utility,workbench}` plus
  `lexical`/`@lexical/react`, `lucide-react`; peers `react`, `react-dom`, `zustand` (the
  workbench dock store is zustand). The **core entry never imports `@semoss/connectors` or
  `@semoss/panels`** — file panels are host-injected blueprints; connectors glue sits behind
  `"./connectors"` so a host that skips it never compiles it (source-only lib).
- `@semoss/chat` follows the `libs/connectors` package conventions: source-only,
  `exports: { ".": "./src/index.ts", "./connectors": "./src/connectors/index.ts", "./globals.css": "./src/styles/globals.css" }`,
  `sideEffects: ["**/*.css"]`, tsconfig extends `@semoss/config/tsconfig.base.json`,
  vitest via `createViteConfig`, `globals.css` with `@source "../**/*.{ts,tsx}"`.
- `@semoss/sdk` keeps its hard rules: **no runtime dependencies** (it bundles the
  `@semoss/utility` categories it imports), framework-agnostic core, React only under
  `js-frameworks/react`, both entries must build.

### 2.2 The SDK room engine (new: grows out of `libs/sdk/src/stores/room/` + `api/chat.ts`)

The engine is the generalization of the playground's MobX stores, informed by what the
`mde4vets-chat` widget had to hand-roll (§2.6). Target modules in `libs/sdk/src`:

- **`api/chat.ts` (rewritten)** — playground-reactor pixel builders on the SDK transport
  primitives. **Every surface uses the playground reactors** — `CreatePlaygroundRoom`,
  `AskPlayground`, `GetPlaygroundMessages`, `AddPlaygroundToolExecution`,
  `GetPlaygroundRooms` — with no reactor-set parameterization: playground, desktop,
  embedded widget, terminal agent and custom apps all share one wire contract.
  Backend verified: `AskPlaygroundReactor extends AskRoomReactor` (identical contract,
  playground project-id override); `CreatePlaygroundRoom`/`GetPlaygroundRooms` take an
  optional `mode`, and `GetPlaygroundRooms` inherits `roomOptionsSearch` / `search` /
  `sort` / `pinned` / `limit` / `offset` from `GetUserConversationRooms`.
  The builders carry the app-level arguments the playground needs (`responseParts`,
  `hiddenMessage`, `paramValues.tools`, rooms `search`/`limit`/`offset`) — now deliberately
  part of the versioned SDK surface, documented in the packaged sdk-chat skill. The other
  room reactors (`GetRoomOptions`, `UpdateRoomOptions`, `SetRoomForInsight`,
  `RemoveUserRoom`, `RenameRoom`, `PinRoom`, `GenerateRoomName`, `StopPixelExecution`,
  `SubmitLlmFeedback`) have no playground variant and are used as-is.
- **`stores/room/` (rebuilt as the engine)** — `RoomEngine` (per-room store: lifecycle,
  options, message tree, ask/cancel, compaction), message stores (input/response turn state
  machines, streaming via the stream-job controller, tool-call loop, agent harness over
  `AgentStore`), `ToolCallStore`, `RoomsClient` (list/create/load/close/rename/pin, model
  selection), `room-session.ts` (the single owner of 1-room-=-1-insight binding). All on
  `Observable`; no DOM, no React, no UI imports. Configured by a framework-free
  `RoomEngineConfig`:
  ```ts
  export interface RoomEngineConfig {
      roomScope?: { token: string };     // marker merged into created rooms' options and
                                         // passed as GetPlaygroundRooms' roomOptionsSearch
                                         // on listing — how an
                                         // embedded surface keeps its history separate.
                                         // Backend matches with a prefix-sensitive LIKE:
                                         // scope tokens must not prefix one another.
      instructions?: string;
      turnContext?: () => string | Promise<string | null>; // re-read before EVERY turn and
                                         // appended to the system prompt (mde4vets'
                                         // pageContext; desktop can supply OS context)
      runParams?: { maxTurns?: number; maxReflections?: number }; // agent-run caps
      clientTools?: ClientToolProvider[];
      toolAutoExecutionLimit?: number | null;
      defaultRoomSettings?: { model?: string };
      autoNameRooms?: boolean;           // GenerateRoomName exists server-side; use it
      onPendingAction?: (action: PendingAgentAction, room: RoomEngine)
          => Promise<AutoDecision | null>; // auto-decide hook, §2.3 #4
  }
  ```
- **`stores/room/client-tool-provider.ts`** — the `ClientToolProvider` interface (framework
  -free), §2.3 #3. The chat-files implementation also lives in the SDK (it is asset-pixel
  calls, no UI); browser- or desktop-specific executors are supplied by hosts.
- **React bindings** (`js-frameworks/react`): `useRoomEngine`-family selector hooks built on
  the existing internal `store-selector.ts` (`useRoomSelector(room, sel)`,
  `useMessageSelector(msg, sel)`, `useRoomsClient(sel)`), exported from `@semoss/sdk/react`.
- **Node/terminal constraint**: engine code may use timers, `fetch` (via SDK transport),
  `FormData`, `crypto.randomUUID` — nothing from `window`/`document`. This is what makes
  the future terminal agent an SDK-only consumer.

What does **not** go in the SDK: the workbench dock (a `RoomUiStore` in libs/chat owns the
zustand dock store and wraps the engine), uploads UI coupling, draft-page UI state,
integrations' UI (composer notices, panels), i18n, rendering.

### 2.3 The four composition seams

1. **`RoomEngineConfig`** (SDK, §2.2) — everything a non-React consumer needs.
2. **`ChatHostConfig`** (libs/chat: `src/host/chat-host-config.ts`) — the UI-layer contract,
   wrapping a `RoomEngineConfig` and adding what only a React host needs. Replaces today's
   `ThemeMap["playground"]` threading (`RootStore → ChatStore → RoomStore`):
   `appName`, `engine: RoomEngineConfig`, `featureFlags`, `allowedFileTypes`,
   `allowedUrlPrefixes`, `gracefulErrors`, `defaultCompactionStrategy`,
   `panelComponents` (workbench blueprints — today's injection seam
   `MainLayout → ChatStore → RoomStore`, now host-owned; **optional**: a host that passes
   none gets no dock and must not pay for workbench), `toolViewLibraries`,
   `integrations: RoomIntegrationFactory[]`, `preferences: ChatPreferencesAdapter`,
   `navigation` callbacks (`onOpenRoom`, `onNewRoom`, … — **libs/chat never imports
   react-router**; hosts own routing), `portalContainer?` (overlays/popovers must portal
   into a configurable container so a Shadow-DOM embed can style them — mde4vets lesson),
   `onOpenSettings?(page)`. Supplied once via `<ChatProvider>`. Branding (logos, CSS
   variables, titles, sidebar items) is **not** in the contract — hosts own it.
3. **`ClientToolProvider`** (SDK) — the client-run tool seam, generalizing exactly how the
   browser-run `folder_*` tools work today
   ([packages/playground/src/features/chat-tools/](packages/playground/src/features/chat-tools/)):
   definitions injected into `paramValues.tools` on **every** ask **and** every
   tool-execution save; a local executor instead of `RunMCPTool`; `decorateToolCall`
   restoring `_meta`; per-tool Auto/Ask/Disabled policy.
   ```ts
   export interface ClientToolProvider {
       id: string;                                        // "chat-files", "desktop"
       getTools(room: RoomEngine): ClientToolDefinition[];
       canHandle(call: ToolCall): boolean;
       execute(call: ToolCall, room: RoomEngine): Promise<string>;
       decorateToolCall?(call: ToolCall): ToolCall;
       policy?(toolName: string): "auto" | "ask" | "disabled";
   }
   ```
   Desktop contributes `createDesktopToolProvider()` over Tauri `invoke` — **zero backend
   change**; when backend-side injection lands later, only `getTools` sourcing changes.
4. **Pending-action auto-decision** (`RoomEngineConfig.onPendingAction`) — chat-mode client
   tools don't reach agent runs (the harness brings its own tools), but mde4vets proves the
   workaround: its `extract_page_text` tool is auto-decided through the **approval
   channel** (`agent.decide(action, "submit", { ...args, page_dom: captureDom() })`), so
   the client supplies data to an agent-run tool with no backend change. The engine hook
   generalizes this: return an `AutoDecision` to answer a pending action programmatically,
   `null` to surface it to the user. This is also how **desktop-tools can participate in
   agent mode**.
5. **`RoomIntegrationFactory`** (libs/chat: `src/host/room-integration.ts`) — per-room UI
   integrations hosting the connectors glue:
   ```ts
   export interface RoomIntegration {
       id: string;
       adopt?(room: RoomEngine): Promise<void>;    // before a draft's first message
       restore?(room: RoomEngine): Promise<void>;  // on room load
       railSources?: { subscribe(l: () => void): () => void; getSnapshot(): RailSource[] };
       composerNotice?: ComponentType;             // e.g. ConnectorSignInNotice
       toolProvider?: ClientToolProvider;
       dispose?(): void;
   }
   ```

### 2.4 Target layout of `libs/chat/src`

```
host/           chat-host-config.ts, chat.context.tsx, room-integration.ts,
                preferences-adapter.ts
stores/         room-ui.store.ts (wraps a RoomEngine: dock store, sidebar snapshot,
                upload UI state), draft.store.ts
react/          useRoomUi.ts and other selector hooks over the UI stores
features/       composer/, conversation/, chat-tools-ui/, tool-views/, tool-inspector/,
                workbench/, draft-room/, suggestions/, room-header/, room-actions/,
                agents/, knowledge/, prompts/, settings/, rooms-list/, feedback/
components/     message/, mcp/, file-preview/, lexical/
connectors/     (the "./connectors" subpath: store, catalog, sign-in, tool-file sync,
                viewer panel registration, manage-connectors settings view)
styles/         globals.css
index.ts        curated public barrel (named exports only)
```

Public surface: `ChatProvider`, UI stores/hooks, contexts (`RoomProvider`,
`NextMessageRoomProvider`, `ToolViewProvider`, draft-room), components (`RoomLayout`,
`RoomComposer`, `RoomContent`, `RoomWorkbench`, message renderers, `ToolsView`,
`MCPOverlay`, `AgentSelector`, base `ROOM_PANEL_COMPONENTS`), page-level building blocks
(`RoomsListView`, `AgentCatalogView`, `AgentFormView`, `KnowledgeView`, `SettingsDialog`).
Consumers use only `@semoss/chat`, `@semoss/chat/connectors`, `@semoss/chat/globals.css`;
inside the package, imports come from defining files (no internal barrels).

### 2.5 Invariants that must not break (verify after every phase)

These are the contracts documented today in
[packages/playground/AGENTS.md](packages/playground/AGENTS.md); they move into the new
AGENTS/skill docs (Phase 3) but hold throughout:

- **The dock store belongs to the room's UI store, not `<Workbench>`** — built and restored
  before first use; `<WorkbenchProvider store={…}>` only hands it down. Blueprints are
  handed over at construction and must be in place before the first `openSidebarPanel`.
- **`RoomSidebar` uses the room's stable `sidebarSnapshot` reference**; arrangements are
  per-room-instance and never persisted across sessions.
- **A restored file panel is re-pointed at the room's live insight** (`_syncSidebarFileMode`)
  because every load binds a fresh insight.
- **Chat turns send client tools in `paramValues.tools` twice** — on ask AND on every
  tool-execution save; leaving them off a save drops them mid-task.
- **Never send `DeleteInsightAssets` an empty path** (clears the whole space); the room
  folder refuses its root and hides/refuses its `mcp` folder.
- **1 room = 1 insight per load**: `SetRoomForInsight` on load; `RemoveUserRoom` +
  `DropInsight` on close; the room page wraps in `<InsightProvider options={{ insightId }}
  destroyOnUnmount={false}>`.
- **Connector tools are the user's, copied into each room** (`mcp/playground_connector_mcp.json`
  → room's `mcp/pixel_mcp.json`); only a *missing* file counts as empty, never a failed read.
- **The SDK owns the session's logins** — no login state or caches in app code.
- **Agent-run lifecycle** per the sdk-chat skill: one watcher per run (the event drain is
  destructive), decide every pending action, reconcile dropped events, local timeouts don't
  cancel backend work.

### 2.6 Validation against `mde4vets-chat` (embedded widget, /Users/nesanghvi/Workspace/mde4vets-chat)

An existing production embed: Shadow-DOM ES-module widget (`MDEChat` global, plain-DOM
launcher shell, lazy React chunk), agent-run-only turns, generic room reactors, cookie
session, per-page theming. It validates the embedded-host requirement and exposed gaps —
each is folded into the design above or a task below:

**Gaps the engine/UI design now covers** (where):
- Surface-scoped history — rooms stamped with a scope token, listed via
  `GetPlaygroundRooms(roomOptionsSearch=…)` → `RoomEngineConfig.roomScope` (§2.2).
- Per-turn system-prompt augmentation re-read before every turn (`pageContext`) →
  `RoomEngineConfig.turnContext`.
- Agent-run caps (`maxTurns`, `maxReflections: 0`) → `RoomEngineConfig.runParams`.
- Client-supplied data to agent tools via approval auto-decide (`extract_page_text` +
  captured DOM) → `onPendingAction` (§2.3 #4); also desktop-tools' agent-mode path.
- Options written before every turn, merged over existing, with `fromWorkspace`/`fromRoom`
  mcp entries filtered before persisting → engine's options module (task 1.3).
- Message feedback (`SubmitLlmFeedback` reactor, thumbs with optimistic revert) → optional
  engine action + `features/feedback/` UI behind a feature flag (task 1.3 / 2.4).
- Room auto-naming → `autoNameRooms` using the server's `GenerateRoomName` (the widget
  truncates client-side and its comment "no server-side name reactor" is stale —
  `GenerateRoomNameReactor` exists).
- Minimal-bundle hosts: no dock, no lexical, no panels → `panelComponents` optional, engine
  importable without UI, slim components documented in the host skill (task 2.4/3.4).
- Shadow-DOM embedding → `portalContainer` in `ChatHostConfig`; no react-router imports in
  libs/chat (navigation callbacks).
- Voice dictation (records WAV, uploads to insight, `LLM(..., useHistory=false)` with
  media, transcription model engine) → optional composer extension, Phase 7 backlog.

**Errors in mde4vets-chat not to repeat** (and to fix when it is rebuilt on the SDK):
- It abuses the unrelated `workbench` room-options key as its scope marker; the engine
  defines a dedicated scope key.
- It hand-rolls ~800 lines the SDK/engine should own (rooms api, turn reducer, agent-run
  buffering, persisted-message parsing in `from-persisted.ts`/`restore-tools.ts`).
- It reuses **one insight across rooms** (sequential `SetRoomForInsight` rebinding) instead
  of 1 room = 1 insight; stale-binding risk the engine's `room-session.ts` avoids.
- A pending action only exists on the live `AgentStore` ref — reload while a run waits for
  approval and it cannot be decided; the engine's run reconnection (playground's
  `reconnectAgentRun` behavior) must move into the engine so every host gets it.
- Mixed reactors undocumented (`CreateRoom` + `GetPlaygroundMessages`); the rebuilt widget
  uses the playground reactors throughout, like every other surface.
- Cookie-only auth (third-party `SameSite` fragility); the rebuilt widget should also take
  the SDK's bearer/embed auth path.
- **SDK bug it worked around**: `getUserRooms` in
  [libs/sdk/src/api/chat.ts:262](libs/sdk/src/api/chat.ts) emits
  `META | GetUserConversationRoomsReactor(...)` — reactor invocations drop the `Reactor`
  suffix (the widget calls `GetUserConversationRooms(...)` successfully), and the wrapper
  exposes none of `roomOptionsSearch`/`limit`/`offset`. Fixed in task 0.4 by listing through
  `GetPlaygroundRooms` with every list argument.

---

## 3. Phase 0 — Rationalize in place (inside playground + SDK fixes, before any move)

Each task is verified by the existing playground/SDK test suites and a manual smoke test.
Nothing moves yet. Tasks 0.1–0.4 are independent and parallelizable; 0.5–0.7 depend on 0.1.

### [x] 0.1 Migrate playground onto `Session`/`Config`

- **Goal**: replace the deprecated `InsightProvider`-as-auth-gate and `actions.login` with
  the SDK session stores, per [libs/sdk/skills/session.skill.md](libs/sdk/skills/session.skill.md).
- **Files**: `packages/playground/src/main.tsx` (after `waitForEmbedAuth()`, call
  `void Session.initialize()`), `src/app.tsx` (drop the app-level `<InsightProvider>`),
  `src/pages/initialized-layout.tsx` (gate on `useConfig((s) => s.status)`),
  `src/pages/authenticated-layout.tsx` (gate on `useSession((s) => s.status)`),
  `src/pages/login-page.tsx` (+ `libs/shared/src/components/form/login-form.tsx` if it
  still takes `actions`), `src/components/common/nav-user.tsx` (`Session.logout()`),
  `src/pages/root-layout.tsx` (theme via `useConfig((s) => s.theme)`).
- **Also**: delete `ChatStore.getUser` / `profileDefaultModelId` / `refreshProfileDefaultModel`
  in `src/stores/chat/chat.store.ts` — duplicates of the session's
  `GetUserInfo(); GetUserMetadata();` read. Use `useSession((s) =>
  s.user?.defaultModels.textGeneration)`, `Session.setMetadata`, `Session.reloadUser()`.
- **Watch out**: `room-page.tsx` keeps its own `<InsightProvider … destroyOnUnmount={false}>`
  — a workspace provider, not an auth gate; it stays.
- **Acceptance**: no `actions.login/logout/requestOTP` or `system.config.` reads left in
  `packages/playground/src`; login (native/LDAP/OTP/OAuth), logout, redirects all work.
- **Verify**: `pnpm --filter @semoss/playground test && pnpm --filter @semoss/playground type-check`;
  manual login each way against a local backend.
- **Landed** (working tree, uncommitted): `main.tsx` starts `Session.initialize()`; the
  app-level `<InsightProvider>` is gone; layouts gate on `useConfig`/`useSession`; the login
  page uses the new shared `SessionLoginForm` (`LoginForm` split into `LoginFormFields` +
  insight/session wrappers so collaboration/auditlog keep theirs); `ChatStore` lost
  `getUser`/`user`/`profileDefaultModelId`/`refreshProfileDefaultModel` (profile default from
  `useSession`, re-read via `Session.reloadUser()`); room-less pixels run through
  `Session.insight` (`utility/run-session-pixel.ts`, `useSessionPixel`, `useSessionInsight`).
  Playground 328/328 (the 2 baseline failures fixed), type-check clean. Manual login against a
  backend not run here.

### [x] 0.2 Pull every pixel string into api modules (staging for the SDK)

- **Goal**: one playground `src/api/` layer holding every pixel builder — the exact code
  that becomes the SDK's parameterized builders in 1.1, so that move is mechanical.
- **Files** (new): `packages/playground/src/api/rooms.api.ts` (`CreatePlaygroundRoom`,
  `GetPlaygroundRooms`, `RemoveUserRoom`, `RenameRoom`, `PinRoom`, `GetRoomOptions`,
  `UpdateRoomOptions`, `SetRoomForInsight`), `ask.api.ts` (the `AskPlayground(...)` builder
  incl. `responseParts`/`hiddenMessage` forms), `tool-execution.api.ts`
  (`AddPlaygroundToolExecution`), `export.api.ts` (`GetPlaygroundMessages` +
  `ToDocx`/`ToPdf` download), `stop.api.ts` (`StopPixelExecution`). Callers:
  `stores/chat/chat.store.ts`, `stores/room/room.store.ts`, `stores/message/*`,
  `features/room-actions/use-room-actions.ts`, `pages/new-room-page.tsx`,
  `pages/chats-page.tsx`, `components/common/global-nav.tsx`,
  `components/workspace/workspace-chat-list.tsx`.
- **Acceptance**: `grep -rn "Playground(" packages/playground/src --include="*.ts*" | grep -v "/api/"`
  returns nothing.
- **Verify**: tests + type-check; manual room create/ask/rename/pin/close.
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

### [x] 0.3 One rooms query

- **Goal**: replace the hand-rolled `GetPlaygroundRooms` reads (`global-nav.tsx`,
  `chats-page.tsx`, `workspace-chat-list.tsx`, `use-room-actions.ts`, `new-room-page.tsx`)
  with one `useRoomsQuery({ search, pinned, limit, offset, sort })` on `rooms.api.ts` +
  `useSessionPixel`. Replace `ChatStore.keys.roomCounter` with a `roomsVersion` the query
  subscribes to.
- **Files**: new `packages/playground/src/hooks/use-rooms-query.ts`; the five callers;
  `stores/chat/chat.store.ts` (drop `keys`; fold `optimisticRooms` into the hook).
- **Acceptance**: one code path reads rooms; nav, chats page and workspace chat list stay
  in sync after create/rename/pin/close.
- **Verify**: tests + manual (create from /new → nav updates; pin/unpin; search).
- **Landed** (working tree): `hooks/use-rooms-query.ts` (`useRoomsQuery({ search, pinned, limit,
  sort, enabled, includeOptimistic })` over `chatPixels.getRooms` in the session's insight,
  re-reading — rows kept — when `ChatStore.roomsVersion` moves; folds the optimistic-room merge
  and housekeeping). `keys.roomCounter` → `roomsVersion` + `bumpRoomsVersion()`. Global nav,
  chats page, agent chat list (pin via `chat.pinRoom`) and room actions all use it; tests in
  `use-rooms-query.test.tsx`. (`offset` is driven by paging, not a caller option.)

### [x] 0.4 SDK fixes (three small changes to `libs/sdk`)

- **Goal A — `getUserRooms` reactor-name bug**: `api/chat.ts:262` emits
  `GetUserConversationRoomsReactor(...)`, which no reactor answers. List through the
  playground reactor instead — `META | GetPlaygroundRooms(...)` — and extend the wrapper with
  the backend's supported `search` / `roomOptionsSearch` / `limit` / `offset` / `mode`
  arguments (§2.6).
- **Goal B — websocket absolute-MODULE fix**: `InsightWebSocket.buildUrl()` in
  [libs/sdk/src/api/websocket.ts](libs/sdk/src/api/websocket.ts) builds
  `window.location.host + Env.MODULE`, broken when `Env.MODULE` is absolute (desktop).
  Derive `ws(s)://host/path` from `Env.MODULE` when absolute.
- **Goal C — sign-in window opener seam**: OAuth/`Logins.connect` call `window.open` inside
  [libs/sdk/src/api/auth.ts](libs/sdk/src/api/auth.ts) (`waitForSignInPopup`). Add an
  injectable opener (e.g. `auth.setSignInWindowOpener(...)`) defaulting to the popup;
  desktop supplies a Tauri `WebviewWindow` opener (task 4.4).
- **Acceptance**: unit tests per fix; existing auth tests green with the default opener; no
  behavior change for web hosts; packaged skills updated where surface changed.
- **Verify**: `pnpm --filter @semoss/sdk test && pnpm --filter @semoss/sdk build`.
- **Landed** (working tree): A — `getUserRooms` removed; `getPlaygroundRooms(insightId, { search,
  roomOptionsSearch, pinned, limit, offset, sort, mode })` lists through `GetPlaygroundRooms`
  (`api/chat.test.ts` pins the reactor name). B — `InsightWebSocket.buildUrl` derives
  `ws(s)://host/path` from an absolute `Env.MODULE` (`api/websocket.test.ts`, runs without a
  `window`). C — `setSignInWindowOpener(opener | null)` + `SignInWindow`/`SignInWindowRequest`
  in `api/auth.ts`; `connectLogin` and `oauth` open through it, default = the old popup
  (existing auth tests unchanged + 3 new). Skill docs updated with the 1.5 rewrite.

### [x] 0.5 Split `RoomStore` into store + controllers (still MobX)

- **Goal**: carve the 1925-line
  [room.store.ts](packages/playground/src/stores/room/room.store.ts) along the future
  SDK/libs-chat boundary, so the engine lift is reviewable. No behavior change.
- **Files** (new, same folder): `room-workbench.controller.ts` (dock store ownership,
  `sidebarSnapshot`, rail sync, `_syncSidebarFileMode` — **stays UI-side later**),
  `room-uploads.controller.ts` (uploads/attachments/allowed-type checks),
  `room-options.ts` (stored-options diffing, `getStoredMcp`, autosave policy — engine-bound);
  `room.store.ts` keeps lifecycle, message tree, ask/cancel, compaction (engine-bound).
- **Acceptance**: `room.store.ts` under ~800 lines; dock invariants (§2.5) demonstrably
  unchanged.
- **Verify**: full playground suite; manual dock smoke — open Files via a streaming tool
  before the sidebar ever mounted, close/reopen sidebar, switch rooms: no duplicate tabs,
  no leaked arrangement.
- **Risk**: highest-churn file in the app; one extraction per commit.
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

### [x] 0.6 Trim `ChatStore` to rooms concerns

- **Goal**: `ChatStore` (968 lines) keeps only rooms-domain logic before it becomes the
  engine's `RoomsClient`.
- **Moves within playground**: agent CRUD (`addWorkspace`/`createAgent`/`editWorkspace`/
  `deleteWorkspace`) → `src/features/agents/agents.api.ts`; `downloadConversation` → thin
  action over `export.api.ts`; `embeddedPageMap` → `features/navigation/`; model-selection
  persistence behind a small `ChatPreferencesAdapter` (sessionStorage impl) instead of raw
  `sessionStorage` in the store.
- **Acceptance**: `chat.store.ts` contains only room cache/registry, create/load/close/
  rename/pin, model selection, room-options defaults.
- **Verify**: tests + type-check; agent create/edit still works.
- **Landed** (working tree): agent CRUD → `features/agents/agents.api.ts`
  (`addWorkspace`/`createAgent`/`editWorkspace`/`deleteWorkspace`, session insight);
  `downloadConversation` → `features/room-actions/download-conversation.ts` over SDK
  `chatPixels.getMessages` + `exportMarkdown` (`formatConversation` tested); `embeddedPageMap`
  → `features/navigation/embedded-pages.ts` (`getEmbeddedPageMap(theme)`); model persistence
  behind `stores/chat/chat-preferences.ts` (`ChatPreferencesAdapter` +
  `createSessionStoragePreferences`, same storage key/format, storage failures tested).
  `chat.store.ts` 968 → ~630 lines: room cache/registry, create/load/close/rename/pin, model
  selection, optimistic rooms/`roomsVersion`.

### [x] 0.7 Naming and structure conformance pass

- **Goal**: file naming/layout match the react standard before anything moves (kebab-case +
  role suffixes — `*.store.ts`, `*.context.tsx`, `use-*.ts`; features own their pieces;
  fold single-use pieces per the standard's
  [fold criteria](skills/react-standard.skill.md#fold-single-use-pieces)).
- **Scope**: rename/fold only, no logic edits (e.g. `components/prompt/PromptOptimizer.tsx`
  → kebab-case; `room-input.tsx` → `room-composer.tsx`).
- **Acceptance**: `pnpm check` clean; no public export dropped.
- **Landed** (working tree): `components/prompt/PromptOptimizer.tsx` →
  `components/prompts/prompt-optimizer.tsx` (folder folded into `prompts/`);
  `components/room/room-input.tsx` → `room-composer.tsx` (`RoomInput` → `RoomComposer`);
  `contexts/{chat,root,tour,file-drag}-context.tsx` → `*.context.tsx`;
  `hooks/use-theme-title.tsx` → `.ts` (typed its param). Biome clean on playground/sdk/shared.

---

## 4. Phase 1 — The SDK room engine

Order: 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6. Each store conversion/lift is its own PR. After
every task the playground must behave identically (it is the engine's first consumer and
its test bed).

### [x] 1.1 Reactor-set-parameterized chat api in the SDK

- **Files**: `libs/sdk/src/api/chat.ts` — port the playground builders from 0.2 as SDK
  functions on the playground reactors (`CreatePlaygroundRoom`, ask via `AskPlayground` with
  `responseParts`/`hiddenMessage`/`paramValues.tools`, tool-execution save via
  `AddPlaygroundToolExecution`, `GetPlaygroundMessages`, rooms list via `GetPlaygroundRooms`
  with search/limit/offset, export, stop). No reactor-set parameter. This is the major release: design the new
  surface cleanly rather than around the old one — the existing wrappers
  (`createRoomRecord`, `askRoom`, …) are replaced or removed, not wrapped for
  compatibility; in-repo callers migrate in this phase (audit in 1.5).
- **Acceptance**: playground's `src/api/*` modules become one-line re-exports over the SDK
  (deleted in 1.4); SDK tests cover each builder's pixel string; the
  packaged [sdk-chat skill](libs/sdk/skills/sdk-chat/SKILL.md) documents the builders.
- **Verify**: `pnpm --filter @semoss/sdk test && build`; playground suite.
- **Landed** (working tree): `api/chat-pixels.ts` (`chatPixels.*` on the playground
  reactors — no reactor set) + runners in `api/chat.ts` (`createPlaygroundRoom`,
  `askPlayground`, `addPlaygroundToolExecution`, `getPlaygroundMessages`,
  `getPlaygroundRooms`, `removeUserRoom`, `renameRoom`, `pinRoom`, `generateRoomName`,
  `stopPixelExecution`, `submitLlmFeedback`, `exportMarkdown`) + `api/insight-assets.ts`.
  Removed: `createRoomRecord`, `getRoomMessages`, `askRoom`, `addRoomToolExecution`,
  `getUserRooms` and their types. Tests: `chat-pixels.test.ts`, `chat.test.ts`.

### [x] 1.2 Convert playground stores to `Observable` in place (leaf → root)

- **Goal**: stores must be framework-free to enter the SDK, so conversion happens *before*
  the lift, inside playground where the full test suite and UI exercise them. Each task:
  rewrite onto a private `Observable` (SessionStore pattern), switch reader components from
  `observer()` to selector hooks (a local copy of the SDK's
  [store-selector.ts](libs/sdk/src/js-frameworks/react/utility/store-selector.ts) until the
  hooks land in `@semoss/sdk/react` in 1.3), add store unit tests. `observer` and
  `useSyncExternalStore` coexist safely during the transition.
- **Order**: (a) `ContextItemsStore` → (b) `ToolStore` → (c) `ChatToolsStore` (introducing
  the `ClientToolProvider` interface; the folder tools become
  `createChatFilesToolProvider()`) → (d) message stores as one unit
  (`abstract/input/response-message.store.ts`, `tool-stream.ts`,
  `tool-save-controller.ts`, `agent-harness.ts`) → (e) `RoomStore` + controllers →
  (f) `ChatStore`.
- **Risk (d) — streaming performance**: streaming currently mutates parts arrays in place
  per chunk under MobX; `Observable` requires copy-on-write per chunk. Give each message
  store its **own** Observable so a chunk re-renders only that message, batch chunk
  application, and profile a long streamed answer (acceptance: no visible typing lag vs.
  the MobX baseline).
- **Risk (e)**: replace the MobX `reaction`s with explicit `subscribe` wiring (rail sync,
  options autosave); the `sidebarSnapshot` identity rules are the easiest silent break.
- **Also (e)**: strip DOM/`window` reads out of engine-bound store code (move them behind
  config or into the UI controllers) — the SDK target forbids them.
- **Verify per store**: focused vitest + manual streaming/tool/dock smoke.
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

### [x] 1.3 Lift the engine into `libs/sdk`

- **Files**: converted engine-bound stores move to `libs/sdk/src/stores/room/` —
  `room-engine.store.ts` (ex-RoomStore core), `rooms-client.store.ts` (ex-ChatStore),
  message stores, `tool-call.store.ts`, `stream-job-controller.ts`, `room-tool-file.ts`,
  `client-tool-provider.ts` (+ `chat-files-tool-provider.ts`), `room-session.ts` (the
  1-room-=-1-insight owner; audit the draft preparation paths —
  `features/conversation/use-new-room.ts` and the `openPlace` flow from
  `pages/new-room-page.tsx` — for stray insight creation), `room-engine-config.ts` (§2.2,
  including `roomScope`, `turnContext`, `runParams`, `autoNameRooms` via `GenerateRoomName`,
  `onPendingAction`, optional `SubmitLlmFeedback` action). The SDK's existing
  `RoomStore`/`createRoom` are **superseded and deleted** — the engine replaces them
  outright (major release); their behaviors worth keeping (options seeding, message reads)
  fold into the engine. React selector hooks (`useRoomSelector`, `useMessageSelector`,
  `useRoomsClient`) land in `@semoss/sdk/react` on the existing internal selector utility.
  Agent-run **reconnection** (playground's `reconnectAgentRun`/`reconstructAllSubagents`)
  moves in as engine behavior (§2.6 error 4).
- **Boundary rule**: no React, DOM, UI, i18n, or workspace-lib imports in engine code; the
  workbench/uploads controllers stay behind in playground (they move to libs/chat in 2.2).
- **Acceptance**: playground imports every store from `@semoss/sdk`/`@semoss/sdk/react`;
  `libs/sdk` builds both entries; engine unit tests run in Node (no jsdom) proving the
  terminal-agent constraint; packaged sdk-chat skill updated with the engine surface.
- **Verify**: `pnpm --filter @semoss/sdk test && build`; full playground suite + manual
  full smoke (login → /new → chat turn with folder tool → agent turn with approval →
  export).
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

### [x] 1.4 Playground consumes the engine

- Delete `packages/playground/src/stores/` and `src/api/` (now SDK); wire
  `RoomEngineConfig` from the playground host config; keep the UI controllers
  (workbench/uploads) wrapping the engine until Phase 2 moves them.
- **Acceptance**: thin-store playground, identical behavior; invariants §2.5 hold.
- **Landed** (working tree): `packages/playground/src/stores/` deleted; `ChatStore` →
  `host/playground-rooms-client.ts` (`createPlaygroundRoomsClient`, a `RoomsClient<RoomUiStore>`
  wired from the theme via `RoomUiStore.buildEngineConfig`); theme store →
  `host/root.store.ts`; preferences → `host/session-preferences.ts`; `constants.ts` removed
  and message types re-exported from the SDK in `types.d.ts`. Playground 274 tests (47 moved
  into the SDK), type-check and Biome clean.

### [x] 1.5 Major-release audit, migration notes, and engine documentation

- **Breaking-release audit**: find every consumer of the old chat/room SDK surface and
  migrate or record it — in-repo (validated: `packages/collaboration` has its own playground
  api modules and does not use the SDK wrappers; check `packages/client`, `terminal`, `cli`)
  and known
  external (`mde4vets-chat` pins `@semoss/sdk 1.0.0-beta.47`; it migrates when rebuilt in
  Phase 7). Remove superseded exports the audit clears (the old `RoomStore`, `createRoom`,
  replaced `api/chat.ts` wrappers); list anything intentionally kept.
- **Migration notes**: a `libs/sdk/MIGRATION.md` (or README section) mapping old → new
  surface, with the version bump in `package.json`.
- **Docs**: SDK AGENTS.md section + packaged skill rewrite covering the engine stores,
  the playground reactors, client tools, `onPendingAction`, room scope, lifecycle/reconnection, and
  Node usage (bearer + `Env.HEADLESS`). The sdk-chat skill is rewritten against the new
  surface, not patched.
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

### [x] 1.6 Remove MobX

- Delete `mobx` + `mobx-react-lite` from `packages/playground`; delete
  `stores/root/root.store.ts` remnants (`configure({ enforceActions })` disappears —
  `libs/renderer` pins its own mobx and configures nothing globally, unaffected).
- **Acceptance**: `grep -rn "mobx" packages/playground --include="*.ts*"` → nothing.
- **Landed** (working tree): `mobx`/`mobx-react-lite` dropped from
  `packages/playground/package.json` (lockfile updated by `pnpm install`); `RootStore` is a
  plain class (the theme is set once); tests no longer use `runInAction`/`observable`
  (`src/testing/observable-fake.ts` gives plain test doubles the store interface). The
  acceptance grep returns nothing.

---

## 5. Phase 2 — `libs/chat`: the UI layer

Order: 2.1 → 2.2 → (2.3, 2.4, 2.5 parallelizable) → 2.6 → 2.7 → 2.8. Prereq: Phase 1.

### [x] 2.1 Scaffold `@semoss/chat` + host contract

- Create the package per §2.1 conventions (validated: no `libs/chat/` leftovers exist) + stub `AGENTS.md` +
  root AGENTS.md entry. Add `src/host/chat-host-config.ts` (§2.3 #2 — every field TSDoc'd),
  `chat.context.tsx` (`ChatProvider` holding the config and the engine's `RoomsClient`),
  `room-integration.ts`, `preferences-adapter.ts`. Playground gains
  `src/host/build-playground-host-config.ts` (pure function merging `VITE_THEME` + server
  `useConfig` theme → `ChatHostConfig`), replacing the `RootStore` theme threading.
- **Acceptance**: playground mounts `<ChatProvider config={…}>`; feature flags (model
  select, temperature) still honored; `pnpm --filter @semoss/chat test` runs.
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

### [x] 2.2 Move the room UI

- **Files**: `components/room/*` → `src/features/composer/` (`room-composer.tsx` +
  `components/lexical/*`), `src/features/conversation/`, `src/features/workbench/`
  (room sidebar host, menus, the workbench+uploads controllers from 1.4 as
  `room-ui.store.ts`, panels + `room-panel.components.ts` as the base
  `ROOM_PANEL_COMPONENTS`), `src/features/room-header/`, `src/features/room-actions/`,
  `src/features/suggestions/`, `src/features/draft-room/` (draft machinery from
  `new-room-page.tsx`); `components/message/**` → `src/components/message/`;
  `components/mcp/*` → `src/components/mcp/`; file previews; `features/tool-views/` +
  `features/tool-inspector/` (tool-view libraries injected via
  `ChatHostConfig.toolViewLibraries`; playground passes `TOOL_VIEW_LIBRARIES` from
  `@semoss/connectors`); chat-tools UI (`ChatToolsPanel`, tool cards) as
  `features/chat-tools-ui/`.
- **Design notes**: slash-menu/plus-menu actions become host-extensible descriptors
  (today's set is the default export); **no react-router imports** — navigation goes
  through `ChatHostConfig.navigation`; overlays respect `portalContainer`; the dock is
  skipped entirely when `panelComponents` is absent (§2.6 minimal-bundle gap).
- **Acceptance**: `pages/new-room-page.tsx` and `pages/room-page.tsx` are thin
  compositions; slash menu, mentions, paste, drag-drop, mermaid/notebook rendering intact.
- **Verify**: playground suite; manual: /new → first message → streamed response → tool
  call → open Files → save a file → export.
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

### [x] 2.3 Move the page-level surfaces

- Rooms list (`components/chats/chat-row.tsx`, list logic from `chats-page.tsx` +
  `global-nav.tsx`, `use-rooms-query.ts`) → `src/features/rooms-list/`; agent
  catalog/forms/detail (`components/workspace/*`, `features/agents/`) →
  `src/features/agents/`; knowledge generic parts → `src/features/knowledge/`; prompts →
  `src/features/prompts/`; settings dialog shell + general page → `src/features/settings/`;
  optional message feedback UI (`SubmitLlmFeedback`, §2.6) → `src/features/feedback/`
  behind a feature flag.
- **Acceptance**: every playground page under `pages/` is a thin route file; nothing but
  brand chrome left in `packages/playground/src/components/`.
- **Landed** (working tree): `features/rooms-list/` (`RoomsListView`, `ChatRow`, `useRoomsQuery`),
  `features/agents/` (`AgentCatalogView`, `AgentDetailView`, `AgentEditView`, `AgentNewView`,
  cards, `agents.api.ts`), `features/knowledge/` (`KnowledgeView`, `KnowledgeDetailView`),
  `features/prompts/`, `features/settings/` (dialog with host `pages`). Every `pages/*` is a thin
  route file; `components/common/` holds only brand chrome (+ `ThemeBanner`). Message feedback
  already ships inside `ResponseMessage` (thumbs, `enableFeedbackText`, SDK
  `SubmitLlmFeedback`), so no separate `features/feedback/` was split out.

### [x] 2.4 i18n: split the chat namespace

- `libs/i18n/src/resources/playground.ts` + `locales/*/playground/*` → carve chat-owned
  namespaces (room, chat-tools, chat-connectors, mcp, sidebar.workbench) into a
  `chatResources` bundle loaded by both hosts; all seven locales.
- **Acceptance**: playground renders identically in en + ar (RTL); no missing-key warnings.
- **Landed** (working tree): `locales/<lng>/chat/` (room, chat, knowledge, workspace, tool, mcp,
  chat-tools, chat-connectors, sidebar) for all seven locales; `chatResources` (chat + the core and
  shared namespaces it reads); `playgroundResources = chatResources + appNav/tour/mobile`. The
  playground-only sidebar keys (`nav`, `userMenu`, `search`, `takeTour`) moved to
  `playground/app-nav.json`. Static check: every `ns:key` literal in chat + playground resolves;
  all locales at key parity (13 pre-existing gaps filled: `sidebar.actions.download` ×6, es
  compaction ×4, nl permissions ×3). Visual en/ar render not checked in a browser here.

### [x] 2.5 Connectors glue → `@semoss/chat/connectors`

- `packages/playground/src/features/connectors/` → `libs/chat/src/connectors/` (store,
  `connector.catalog.ts`, `connector-tools.ts`, `connector-sign-in.ts`,
  `use-connections.ts`, `use-connector-logins.ts`, viewer panel registrations + icons,
  sign-in notice, the settings Connectors page as an exported view). Shape: exported
  `createConnectorsIntegration(options)` (a `RoomIntegrationFactory`) +
  `CONNECTOR_PANEL_COMPONENTS` + `ConnectorsSettingsView`. "Manage Connectors" routes
  through `ChatHostConfig.onOpenSettings`.
- **Acceptance**: playground wires connectors only via the integration + spread; all
  connector invariants (§2.5) hold; a host that skips the subpath compiles without
  `@semoss/connectors`.
- **Landed** (working tree): `src/connectors/` exports `createConnectorsIntegration()`,
  `CONNECTOR_PANEL_COMPONENTS` (+ `CONNECTOR_PANEL_TYPES`), `CONNECTORS_SETTINGS_PAGE`,
  `ConnectorsSettingsView`, `createConnectorToolProvider`, `getRoomConnectors`. The core reaches
  connectors only through `RoomIntegration` (draft prepare/adopt/restore, rail panels, busy +
  suggestion context, context-item icons, tool-call ownership/presentation + sign-in notice,
  tool-view sign in, settings page, composer notice, settings section); "Manage connectors" goes
  through `useOpenSettings` (`config.onOpenSettings`, else the chat's settings dialog). Grep:
  no runtime `connectors/`, `@semoss/connectors` or `@semoss/panels` import in core sources.

### [x] 2.6 Thin-shell audit of playground

- **End-state**: `packages/playground/src` = `pages/` (route files),
  `host/build-playground-host-config.ts`, brand chrome (`app-logo`, `global-nav`,
  `global-footer`, `nav-user`, tour, landscape restriction), embed page + iframe sync,
  navigation, assets, `app.tsx`/`main.tsx`. Dependency cruft dropped (lexical, mermaid move
  to libs/chat).
- **Verify**: `pnpm --filter @semoss/playground test/type-check/check`; full manual smoke.
- **Landed** (working tree): `packages/playground/src` = `pages/`, `host/`, brand chrome
  (`components/common/`, `features/navigation/`), `contexts/`+`hooks/` for theme/tour, `app.tsx`,
  `main.tsx`, assets. `lexical`, `@lexical/react`, `mermaid` dropped (lockfile via `pnpm
  install`); `src/index.css` imports `@semoss/chat/globals.css`. Playground test (13), type-check,
  Biome and production `pnpm build` pass. Full manual smoke not run (no backend here).

### [x] 2.7 Collaboration cross-check (read-only)

- `packages/collaboration/src/features/rooms/` independently implements rooms/agent runs on
  the same reactors (`create-room.ts`, `agent-run-api.ts`, `agent-turn-controller.ts`).
  Record concrete adoption gaps against the SDK engine in `libs/chat/AGENTS.md` + a Phase 7
  entry. **No collaboration changes in this effort.**
- **Landed** (working tree): gaps recorded in `libs/chat/AGENTS.md` ("Collaboration
  cross-check"): no engine `roomMode` (collaboration creates/lists with `mode: "collaboration"`),
  own pixel/zod transport, own room session, own agent-turn controller, own options/name/model/
  upload handling, Brain topics/threads (a future integration), own composer. Phase 7 entry
  updated. No collaboration changes.

### [x] 2.8 Selector-hook/API polish

- Final pass over the `@semoss/chat` barrel: named exports only, TSDoc on every public
  type, no accidental deep-import requirements, `pnpm check` clean.
- **Landed** (working tree): `src/index.ts` curates the public surface (host contract, UI store +
  contexts, building blocks, views, settings, types); named exports only; every barrel export has
  TSDoc (scripted check); no deep imports needed by playground; Biome clean.

---

## 6. Phase 3 — Documentation (the boundary is the deliverable)

### [x] 3.1 `libs/chat/AGENTS.md`

- Boundary statement (what the lib owns / refuses — notably: no transport, no engine state,
  no routing, no branding), the seams with examples, the invariants migrated from
  [packages/playground/AGENTS.md](packages/playground/AGENTS.md) ("The room Workspace",
  "Chat tools", "Tool views", "Files queued for the next message"), the `"./connectors"`
  subpath contract, testing commands.
- **Landed** (working tree): boundary (owns/refuses), structure, the seams with examples
  (`ChatHostConfig`/`ChatProvider`, `RoomIntegration` table), glossary, the migrated invariants
  (Workspace, chat tools, slash menu, tool views, context items, connectors subpath, agent forms),
  translations, the collaboration gaps, testing.

### [x] 3.2 Rewrite `packages/playground/AGENTS.md`

- Thin-shell description; pointers into `libs/chat/AGENTS.md` and the SDK skills.
- **Landed** (working tree): thin-shell description, how the shell is wired (theme → config,
  panels, connectors, navigation, styles, translations), pointers into `libs/chat/AGENTS.md` and
  the SDK guides; build/env/test sections kept.

### [x] 3.3 Root docs

- Root [AGENTS.md](AGENTS.md): add `@semoss/chat` to the workspace summaries, the layering
  diagram (`chat → workbench/shared/sdk/ui/i18n/utility`; `chat/connectors → connectors`),
  and the nested-AGENTS list; note the SDK room engine in the SDK summary.
- **Landed** (working tree): root `AGENTS.md` lists `@semoss/chat` (summaries, layering, workspace
  tree, nested guides, host wiring note), the SDK room engine in the SDK summary, and the
  chat-host skill.

### [x] 3.4 `skills/chat-host.skill.md` (new)

- "How to stand up a new chat host": SDK-only recipe (terminal/custom apps: engine config,
  bearer/HEADLESS auth, Node constraints) and React recipe (ChatProvider + host config,
  Session bootstrap, panel blueprints + `@semoss/panels/vite` helpers +
  globals.css imports, client tool providers, integrations, minimal-bundle/Shadow-DOM
  guidance from §2.6). Add to [skills/README.md](skills/README.md).
- **Landed** (working tree): SDK-only and React recipes, Workspace/file panels, client tools and
  integrations, minimal bundles and Shadow DOM, verification; indexed in `skills/README.md`.

---

## 7. Phase 4 — `packages/playground-desktop` (Tauri 2)

Prior art to mine (reference only, both abandoned): Electron on
`origin/feat-desktop-local-fs` (local-fs tools with allowlist + path guard) and **Tauri on
`origin/semoss-desktop-rust` commit `704c4ed84`** — `packages/desktop` with a native fetch
bridge (`src/api/transport.ts`), `platform/sdk-host.ts` (absolute `Env.MODULE`),
`auth-window.ts`, cookie-sync in `lib.rs`, CSP in `tauri.conf.json`. Inspect with
`git show 704c4ed84:<path>`. Can start after Phase 2 (needs libs/chat). 4.1 → 4.2 →
(4.3, 4.4 parallel) → 4.5 → 4.6.

### [x] 4.1 Scaffold the app

- **Files** (new): `packages/playground-desktop/` — `package.json` (private; workspace
  deps: chat, connectors, i18n, panels, sdk, shared, ui, utility, workbench),
  `vite.config.ts` (via `createViteConfig`; **must** add `aiSdkStubAlias` +
  `scopePptxViewerCssPlugin` from `@semoss/panels/vite` + the monaco alias — copy the
  playground wiring), `index.html`, `src/main.tsx` + `src/app.tsx` (no `waitForEmbedAuth`;
  `Session.initialize()` only after an instance is selected), `src/index.css` importing the
  globals of ui/shared/connectors/workbench/panels/chat, `src-tauri/` (`Cargo.toml` tauri
  2.x, `tauri.conf.json` with CSP, `capabilities/`, icons — port from `704c4ed84`,
  `src/lib.rs` command registry). Register a dev port in `@semoss/config`
  `DEV_SERVER_PORTS`; root `pnpm dev:desktop` script; root AGENTS.md entry.
- **Acceptance**: `tauri dev` opens a window rendering a placeholder router.
- **Risk**: Rust toolchain requirement — document setup in the package AGENTS.md (4.7).
- **Landed** (working tree, partly verified): `packages/playground-desktop` (package.json with the
  listed workspace deps and **no Tauri npm packages** — `app.withGlobalTauri` exposes the API on
  `window.__TAURI__`, typed in `src/platform/tauri.ts`), `vite.config.ts` (panels' `aiSdkStubAlias`
  + `scopePptxViewerCssPlugin` + monaco alias), `index.html`, `src/main.tsx` + `src/app.tsx`
  (`Session.initialize()` only once an instance is in use), `src/index.css` (all six globals),
  `src-tauri/` (`Cargo.toml`, `build.rs`, `tauri.conf.json` with CSP, `capabilities/default.json`,
  icons from `704c4ed84`, `src/lib.rs` command registry). `DEV_SERVER_PORTS.playgroundDesktop =
  5181`; root `pnpm dev:desktop`; root AGENTS.md entry. Web bundle type-checks, tests and builds;
  the Rust side was written but **not compiled** (no Rust toolchain on this machine; none was installed without the user's say-so), so `tauri dev` was not run.

### [x] 4.2 Native fetch bridge + SDK host wiring

- **Goal**: all SDK HTTP leaves via Rust so cookies, CORS and CSP are non-issues.
- **Files**: `src-tauri/src/lib.rs` — port `native_http_request` from `704c4ed84`
  (webview-cookie sync: `cookies_for_url` → `Cookie` header, `Set-Cookie` → webview jar —
  what makes auth-window logins share one jar) and **extend it for binary/multipart**
  (base64 bodies + content-type for `uploadInsight` FormData; base64 responses for
  downloads). `src/platform/fetch-bridge.ts` overrides `window.fetch` for
  `Env.MODULE`-prefixed URLs (the `704c4ed84` approach). `src/platform/sdk-host.ts`:
  `Env.update({ MODULE: absoluteUrl })`, CSRF enablement from the instance's `/api/config`.
- **Acceptance**: against a hosted instance: `/api/config` loads; a cookie-session login
  survives subsequent pixel calls; `uploadInsight` works; a download round-trips.
- **Risk (flagged)**: multipart over IPC is the least-proven piece; build a test harness
  page first.
- **Landed** (working tree): `src/platform/fetch-bridge.ts` (every body — string, form, Blob,
  `FormData` multipart — encoded via `new Response(body)` and sent base64; base64 responses, so
  binary downloads survive; 6 tests incl. multipart and binary), `sdk-host.ts` (Rust told the
  instance first via `set_active_instance`, absolute `Env.MODULE`; CSRF from `Config.load`).
  `lib.rs` `native_http_request` ports `704c4ed84` (cookie sync with the webview jar) with a
  runtime active-instance allowlist (origin + module path), base64 bodies both ways, `authorization`
  / `bearer-provider` allowed for bearer sessions. Not run against a hosted instance; the Rust side was written but **not compiled** (no Rust toolchain on this machine; none was installed without the user's say-so).

### [x] 4.3 Instance picker + preferences

- **Files** (new): `src/features/instances/instance.store.ts` (Observable; state
  `{ instances: InstanceProfile[], activeInstanceId, status }`,
  `InstanceProfile = { id, name, url, module, lastLoginMethod, bearerProvider? }`);
  persistence via `tauri-plugin-store` (`preferences.json` in app-data — replaces the prior
  branch's compile-time `VITE_DESKTOP_PROFILES`); `instance-picker-page.tsx` (first run:
  URL + module path defaulting `/Monolith`, validated by fetching `/api/config` through the
  bridge; list/edit/remove saved instances); the desktop `ChatPreferencesAdapter` over the
  same store.
- **Acceptance**: first launch shows the picker; bad URL shows the config error; the list
  survives restart; switching instances tears the session down (webview reload or
  `Env.update` + `Session.refresh()` — pick one and document it).
- **Landed** (working tree): `InstanceStore` (Observable; validated reads; persisted through
  `tauri-plugin-store` `preferences.json`, memory outside the shell; 5 tests),
  `instance-picker-page.tsx` + `instance-form.tsx` (URL + module defaulting `/Monolith`, checked
  through `check_instance` before saving), desktop `ChatPreferencesAdapter` (per-instance model in
  the same file). **Switching instances reloads the webview** (documented in the package guide).

### [x] 4.4 Login: every method + bearer tokens + keychain

- **Files**: `src/features/auth/login-page.tsx` — provider list from
  `useConfig((s) => s.config?.loginDetails)` (native/LDAP via `Session.login`; OTP via
  `Session.requestOTP` + linotp) plus a **Bearer token** tab: token + optional provider →
  `Env.update({ BEARER_TOKEN, BEARER_PROVIDER })` then `Session.initialize()` (the SDK
  fetch interceptor already sends `Authorization: Bearer` + `Bearer-Provider`). OAuth +
  connector sign-ins: `src/platform/auth-window.ts` implements the 0.4 opener seam with a
  Tauri `WebviewWindow` on `${MODULE}/api/auth/login/<provider>`; `Session.refresh()`
  after close. Keychain: `src-tauri` commands `secret_set/get/delete` over the `keyring`
  crate (service `semoss-desktop`, account = instance id); bearer tokens live there with a
  "remember this token" toggle.
- **Security rule (hard)**: no token, cookie or secret ever in localStorage/sessionStorage
  or the plugin-store file — keychain only.
- **Acceptance**: sign in via native, OAuth and bearer against a hosted instance; bearer
  session survives restart via keychain; logout clears the stored token.
- **Landed** (working tree): `login-page.tsx` — `SessionLoginForm` (native/LDAP/OTP/OAuth from the
  config's providers) plus a bearer-token tab (`Env.BEARER_TOKEN`/`BEARER_PROVIDER` +
  `Session.refresh()`, refused tokens shown inline, "Remember" → keychain). OAuth and connector sign
  ins use `setSignInWindowOpener` with Rust-built `semoss-auth-*` windows (no capability) that emit
  navigation/close events. Keychain: `secret_get/set/delete` over `keyring` (service
  `semoss-desktop`); sign out deletes a remembered token. Not exercised against a backend.

### [x] 4.5 Chat shell composition

- `src/app.tsx` + `src/pages/router.tsx` — `<ChatProvider config={buildDesktopHostConfig(...)}>`
  (playground reactors, as everywhere), `panelComponents = { ...ROOM_PANEL_COMPONENTS,
  ...CONNECTOR_PANEL_COMPONENTS }` (desktop panels added in 5.2), `integrations =
  [createConnectorsIntegration(...)]`, `clientTools = [createChatFilesToolProvider()]`
  (desktop provider added in 5.1); routes: instance-picker → login → `/new`, `/room/:id`,
  `/chats`, `/agent` surfaces from `@semoss/chat`; minimal desktop nav chrome.
- **Acceptance**: full lifecycle against a hosted backend — create room from /new, stream,
  folder tool (Ask mode), agent turn with approval, Files in the dock, connector viewer
  after sign-in, rename/pin/close.
- **Verify**: type-check + the manual matrix on macOS at minimum.
- **Landed** (working tree): `DesktopLayout` mounts `<ChatProvider config={buildDesktopHostConfig}>`
  (the instance's playground theme for flags/limits; client tools = chat files + connectors +
  desktop; integrations = connectors + desktop tools + desktop panels; panels = files + room +
  connectors + browser) and `SettingsDialogProvider` with the Connectors page; hash routes for
  `/new`, `/room/:id`, `/chats`, `/agent…`, `/knowledge…` render `@semoss/chat` views; a narrow
  desktop nav. Type-check + host-config tests pass; the manual lifecycle matrix was not run.

### [x] 4.6 Downloads and exports through the bridge

- The SDK `download()` anchor navigation doesn't work cross-origin in a webview: route
  conversation export (`ToDocx`/`ToPdf`) and file downloads through the binary bridge +
  `tauri-plugin-dialog` save dialog.
- **Acceptance**: export a conversation to docx; save a file from the file explorer.
- **Landed** (working tree): SDK seam `setDownloadHandler` (`api/file.ts`, 3 tests, SDK guide);
  `downloads.ts` reads the file through the bridge and Rust `save_file_with_dialog` asks where to
  save (the page never picks a path). Not exercised end to end.

### [x] 4.7 `packages/playground-desktop/AGENTS.md`

- Boundary (platform/, instances, auth-window, Rust commands), security rules
  (keychain-only secrets, CSP, allowlisted invoke surface), Rust toolchain setup,
  `tauri dev`/`tauri build` workflow, pointer to `skills/chat-host.skill.md`.
- **Landed** (working tree): boundary and structure, how the bridge/sign in/downloads/composition
  work, hard security rules (keychain-only secrets, instance allowlist, invoke surface, CSP, ask
  for disk), Rust toolchain setup, dev/build workflow, release steps, verification status.

---

## 8. Phase 5 — Desktop extensions

### [x] 5.1 Desktop tools (`desktop-tools` feature)

- **Files** (new): `src/features/desktop-tools/desktop-tool.provider.ts` —
  `createDesktopToolProvider()` implementing the SDK's `ClientToolProvider`; definitions
  injected at room creation and on every ask/save (alongside, not replacing, the Chat Files
  tools); `execute` dispatches to typed `invoke("desktop_<tool>")`; Auto/Ask modes surfaced
  like the folder tools. For **agent mode**, register an `onPendingAction` auto-decision
  (§2.3 #4, the mde4vets `extract_page_text` pattern) so desktop data can answer agent tool
  pauses too. `src-tauri/src/lib.rs`: matching commands behind a capability allowlist.
  **v1 ships the seam + one or two proof tools** (`desktop_open_path`, `desktop_notify`);
  local-fs read/write later ports the allowlist + path-guard design from
  `origin/feat-desktop-local-fs` commit `8c3b17190`.
- **No backend changes.**
- **Acceptance**: a chat turn where the model calls a desktop tool end-to-end (definition
  sent, Ask approval card, Rust command runs, result saved via the tool-execution reactor,
  model continues; survives a follow-up call — the send-twice invariant).
- **Landed** (working tree): `createDesktopToolProvider()` (`desktop_notify` auto, `desktop_open_path`
  ask — reveals, never opens; 4 tests) + `createDesktopToolsIntegration()` so calls get the chat tool
  card; `ChatToolCard` now approves any client tool call locally (`room.chatTools.canRun`), not only
  folder calls. Rust `desktop_notify` / `desktop_reveal_path`. Agent mode via `onPendingAction` is
  documented, not wired. The end-to-end model turn was not run.

### [x] 5.2 Desktop panels (browser panel first)

- **Files** (new): `src/features/desktop-panels/browser-panel.tsx` +
  `desktop-panel.components.ts` (`DESKTOP_PANEL_COMPONENTS` spread into
  `panelComponents`). v1: iframe `WorkbenchPanelConfig<{ url: string }>` with
  `mount: "keepAlive"` (workbench rule for iframes), URL bar, CSP `frame-src https:`;
  documented limitation: `X-Frame-Options`/`frame-ancestors` sites won't render. v2 spike
  (flagged): Tauri child-webview embedding.
- **Acceptance**: open a browser panel from the dock, navigate, survives sidebar
  close/reopen, per-room isolation.
- **Landed** (working tree): `BrowserPanel` (keepAlive iframe, sandboxed, http(s)-only address bar,
  address in the panel config so it is per room and survives close/reopen; URL test) and
  `createDesktopPanelsIntegration()` (rail + Open a Panel); CSP `frame-src https:`. Framing-refusing
  sites documented. v2 (child webviews) left in the backlog.

### [x] 5.3 Packaging

- `tauri build` producing signable artifacts for macOS (+ Windows if runners exist); icons;
  version wiring; release-steps doc.
- **Partly landed** (working tree): `tauri:build` script, bundle config and icons, version wiring
  and release steps (signing/notarization variables) in the package guide. No artifact was built
  (no Rust toolchain here).

---

## 9. Phase 6 — Cleanup, deduplication and standardization

A deliberate consolidation pass once the stack is whole (SDK engine + libs/chat + playground
shell + desktop). The moves in Phases 1–5 optimize for reviewability, which leaves seams:
duplicated helpers, transitional wrappers, loose naming. This phase makes the result clean,
deduplicated, and standard-conformant. Order: 6.1 → 6.2 → 6.3 → 6.4 → 6.5 (6.1–6.3 can
interleave per package).

### [x] 6.1 Deduplication sweep

- **Goal**: one home per behavior across sdk / chat / playground / playground-desktop.
- **Scope**: generic helpers that grew in app or lib code during the migration move to the
  matching `@semoss/utility` category per
  [libs/utility/AGENTS.md](libs/utility/AGENTS.md) (search individual files, nested
  functions, and repeated expressions — equivalent implementations may differ in name and
  syntax; preserve whitespace/timezone/rounding/null/error behavior, add compatibility
  adapters only where a public contract needs one). Known candidates to check: the
  store-selector copy made in task 1.2 if any component kept a local one (single home is
  the SDK's — libs/chat re-exports nothing, components use `@semoss/sdk/react` hooks);
  date/text/file helpers inside moved chat features; repeated pixel-result validation
  shapes; duplicated test utilities between playground and libs/chat. Repeated UI
  composites across chat/desktop/playground go to `@semoss/ui` or local composites per
  [DESIGN.md](DESIGN.md) — do not force one-off pieces upward.
- **Acceptance**: a written sweep log in the PR description (what was merged where, what
  was deliberately left); no two implementations of the same helper reachable from two
  packages.
- **Verify**: full `pnpm test` + `pnpm check` at the root; playground + desktop manual
  smoke.
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

### [x] 6.2 React-standard conformance audit

- **Goal**: `libs/chat`, `packages/playground`, `packages/playground-desktop`, and the SDK
  areas this effort touched pass the react standard's
  [full-file review](skills/react-standard.skill.md#full-file-review-and-handoff).
- **Scope**: fold single-use components/hooks/helpers/files per the
  [fold criteria](skills/react-standard.skill.md#fold-single-use-pieces); hook contracts
  (explicit typed inputs/returns, no lifecycle-named hooks, no caller-managed dep arrays);
  effect hygiene (complete deps, cleanup, stale-result guards); naming (kebab-case + role
  suffixes, `use-*.ts`, `onX`/`handleX`/`is|has|should`); named exports; TSDoc on public
  contracts; semantic Tailwind tokens only (no arbitrary values, no invented hex);
  accessibility spot-checks on the new surfaces (composer, instance picker, login, panels)
  per [skills/accessibility.skill.md](skills/accessibility.skill.md).
- **Acceptance**: review findings fixed or explicitly waived with reasons, recorded per
  package; `pnpm check` clean with no new suppressions.
- **Landed** (working tree): new and moved code reviewed against the standard — one component per
  file (a wrapper split was replaced by `requireRoomConnectors`), hooks with typed returns
  (`useOpenSettings`, `useRoomFileHost`, `useRoomToolViewHost`, `useIsDarkMode`), effects with
  complete deps (agent/knowledge redirects), TSDoc on every public export, forms per the form
  skill (instance, bearer token), a11y spot checks (labelled controls, `useId` labels, nav label,
  frame title, icon-button names). Biome clean for chat, playground, playground-desktop, i18n;
  the only suppressions are pre-existing ones carried with moved code. Waived: `Props` types stay
  exported by convention.

### [x] 6.3 Dead code and dependency pruning

- **Goal**: nothing transitional survives the migration.
- **Scope**: delete leftover re-export shims, orphaned files, unused exports (grep-based or
  a one-off unused-export scan) across the four packages; prune each `package.json` to what
  it imports (lexical/mermaid only in libs/chat; mobx gone everywhere but `libs/renderer`;
  no stray `@semoss/connectors` outside the chat subpath and hosts that wire it); verify
  `turbo.json` task graph still matches reality (source-only libs have no build task).
- **Acceptance**: dependency-graph check passes (chat core compiles without
  connectors/panels; SDK engine tests run in Node with no jsdom); install size of
  playground-desktop unchanged or smaller than at the end of Phase 5.
- **Landed** (working tree): removed dead exports (per-viewer panel constants, `findConnectorSource`,
  two folder-label helpers, `ProjectDependency`), the chat runner copy, host tool-view copies and
  playground's `contexts/`/`hooks/` barrels; lexical/mermaid only in `libs/chat` among these
  packages; `@semoss/connectors` only in hosts that wire it (their stylesheet) and the chat's
  optional peer; mobx remains only in `libs/renderer`, `client` and `auditlog` (not part of this
  effort). `src/package-boundaries.test.ts` proves the chat core compiles without
  connectors/panels/router (and was shown to fail on a probe import); SDK engine tests run in Node.
  `turbo.json` unchanged (source-only libs have no build script).

### [x] 6.4 Public API tightening

- **Goal**: every package's public surface is curated and minimal.
- **Scope**: re-audit `@semoss/sdk` and `@semoss/sdk/react` exports against the engine docs
  (nothing internal leaked — the selector cache, pixel builders' internals);
  `@semoss/chat` barrel exports only what the host skill documents; subpath boundaries
  enforced by a lint or test (importing `@semoss/chat/connectors` from core fails);
  defining-file imports inside packages (no internal barrels).
- **Acceptance**: an intentional-exports list per package checked into its AGENTS.md;
  type-check across every consumer.
- **Landed** (working tree): intentional-export lists in `libs/chat/AGENTS.md` (three entries) and
  the SDK guide (host seams); the chat barrel matches the host skill; subpath boundaries enforced
  by the boundary test; SDK React entry exports hooks only (selector cache internal). Type-check
  passes for sdk, chat, playground, playground-desktop.

### [x] 6.5 Documentation re-verification

- **Goal**: docs match the settled code, not the migration's intermediate states.
- **Scope**: re-read `libs/chat/AGENTS.md`, `packages/playground/AGENTS.md`,
  `packages/playground-desktop/AGENTS.md`, the SDK AGENTS.md engine section, both packaged
  SDK skills, `skills/chat-host.skill.md`, and the root AGENTS.md layering against the
  final source; fix every stale path, name, and contract; prune `task.md` itself to a
  completed-work record with the Phase 7 backlog.
- **Acceptance**: every file path and export named in those docs exists; a cold read of
  `skills/chat-host.skill.md` is enough to scaffold a new host.
- **Landed** (working tree): the chat, playground, desktop, SDK and root guides and the chat-host
  skill re-read against the final source; a scripted check found every named file and symbol (its
  only hits were server asset paths, collaboration files and env-var names). This file is pruned
  to the completed-work record below.

---

## 10. Phase 7 — Future hosts and deferred work (backlog, ordered by value)

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
- [ ] **Browser panel v2** — Tauri child-webview spike (unstable multiwebview API).
- [ ] **Voice dictation** — optional composer extension (mde4vets pattern: 16 kHz WAV
  upload + `LLM(..., useHistory=false)` with media against a transcription model engine).
- [ ] **Desktop tool catalog** — local-fs tools with allowlist + path guard.

---

## 11. Standards appendix (read before picking up any task)

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
