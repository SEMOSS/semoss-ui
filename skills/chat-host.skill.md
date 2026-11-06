---
name: chat-host
description: "Use when standing up a new chat host (an app, desktop shell, embed, extension, or CLI) on the SDK room engine and @semoss/chat: the ChatHostConfig, ChatProvider, Session bootstrap, panel blueprints, client tool providers, room integrations, navigation, minimal bundles, and Shadow-DOM embedding."
---

# Standing Up a Chat Host

A chat host composes two layers and owns nothing else but its routes and brand:

- **The SDK room engine** (`@semoss/sdk`: `RoomsClient`, `RoomEngine`, client tool providers),
  framework-free. Read the [packaged SDK chat guide](../libs/sdk/skills/sdk-chat/SKILL.md) and the
  [session guide](../libs/sdk/skills/session.skill.md).
- **The chat UI** (`@semoss/chat`), React. Read [libs/chat/AGENTS.md](../libs/chat/AGENTS.md).

Every surface goes through the playground reactors (`CreatePlaygroundRoom`, `AskPlayground`,
`GetPlaygroundMessages`, `AddPlaygroundToolExecution`, `GetPlaygroundRooms`); never hand-roll room
pixels. `packages/playground` is the reference host: `src/host/build-playground-host-config.ts` and
`src/pages/main-layout.tsx`.

## SDK-only recipe (terminal agents, custom apps, no React)

1. **Point the SDK at the server**: `Env.update({ MODULE: "https://host/Monolith" })`. An absolute
   `MODULE` also points the insight websocket there. In Node, authenticate with `Env.HEADLESS` or
   a bearer token rather than cookies; never ship access keys in a browser build.
2. **Start the session**: `await Session.initialize()`; rooms list and close through the
   session's insight.
3. **Run rooms**:

   ```ts
   const rooms = new RoomsClient({
   	engine: {
   		appName: "My CLI",
   		roomScope: { token: "my-cli" },          // list only this host's rooms
   		clientTools: [myToolProvider],           // ClientToolProvider: run tools locally
   		onPendingAction: (action) => null,       // or an AutoDecision for agent runs
   	},
   	defaultModel: { id: "…", name: "…" },
   });
   await rooms.initialize();
   const room = await rooms.createRoom("chat", "Hello", [], { instructions: "", mcp: [] });
   room.subscribe(() => render(room.getSnapshot()));
   ```

4. Respect the engine's invariants: one room = one insight per load (close with
   `rooms.closeRoom`), one watcher per agent run, decide every pending action, and local
   timeouts never cancel backend work.

## React recipe

1. **Bootstrap the session** above the chat, as `InitializedLayout` and `AuthenticatedLayout`
   do: `Session.initialize()`, `useSession`, `useConfig`. In a webview, sign-in windows go
   through `setSignInWindowOpener` and downloads through `setDownloadHandler`; see
   `packages/playground-desktop` (its `src/platform/`) for a complete desktop host.
2. **Import the styles** every layer needs: `@semoss/ui/globals.css`, `@semoss/shared/globals.css`,
   `@semoss/chat/globals.css`, and, if you show them, `@semoss/workbench/globals.css`,
   `@semoss/panels/globals.css`, `@semoss/connectors/globals.css`. A missing `globals.css` means
   Tailwind never generates that package's classes.
3. **Load translations**: `chatResources` from `@semoss/i18n` (plus your own namespaces) through
   `I18nBuilder`.
4. **Build a `ChatHostConfig`** once, as a pure function of your settings, and mount it:

   ```tsx
   <ChatProvider config={config}>
   	<SettingsDialogProvider pages={[CONNECTORS_SETTINGS_PAGE]}>{routes}</SettingsDialogProvider>
   </ChatProvider>
   ```

   - `navigation`: map every request (`onOpenRoom`, `getRoomHref`, `onNewRoom`, `onLeaveRoom`,
     agents, knowledge, `onBack`) onto your router. `@semoss/chat` imports no router.
   - Start from a playground theme with `chatSettingsFromTheme(theme)` (name, flags, limits,
     default tools, file types, friendly errors), then add the engine's client tools, panels,
     integrations and navigation. Flags left out keep `DEFAULT_CHAT_FEATURE_FLAGS`.
   - `preferences`: `createSessionStoragePreferences()` in a browser; your own store on desktop.
   - `onOpenSettings` when your settings live outside the chat's `SettingsDialogProvider`.
5. **Route to the views**: `RoomView` (`roomId`, `headerLeading`), `NewRoomView` (`agentId`,
   `knowledgeId`, `initialPrompt`, and the `banner` / `background` / `welcome` / `description`
   slots), `RoomsListView`, `AgentCatalogView`, `AgentDetailView`, `AgentEditView`,
   `AgentNewView`, `KnowledgeView`, `KnowledgeDetailView`. A route reads its address and renders
   a view; brand content goes into the view's slots.

## The Workspace and file panels

The Workspace is optional. To have one:

- Pass `panelComponents`: `CHAT_FILE_PANEL_COMPONENTS` (from `@semoss/chat/panels`: the file
  explorer and editors, the explorer closable), `ROOM_PANEL_COMPONENTS`, and any integration
  viewers. Keep the record at module scope: a new identity remounts every panel.
- Pass `filePanels: CHAT_FILE_PANELS` (from `@semoss/chat/panels`).
- Take `aiSdkStubAlias` and `scopePptxViewerCssPlugin` from `@semoss/panels/vite`; see
  [libs/panels/AGENTS.md](../libs/panels/AGENTS.md#what-a-host-has-to-wire-up).

## Client tools and integrations

- **Client tools** run in the host: add a `ClientToolProvider` to `engine.clientTools`. Its tools
  are sent on every ask and every tool-execution save. Agent runs bring their own tools; reach
  them with `engine.onPendingAction` auto-decisions.
- **Integrations** add per-room UI state and views: a `RoomIntegrationFactory` in
  `config.integrations` (rail panels, composer notice, settings section, tool-call presentation,
  suggestion context; see the table in [libs/chat/AGENTS.md](../libs/chat/AGENTS.md#roomintegration)).
- **Connectors**: `@semoss/chat/connectors` — `createConnectorToolProvider()`,
  `createConnectorsIntegration()`, `CONNECTOR_PANEL_COMPONENTS`, `CONNECTOR_TOOL_VIEW_LIBRARIES`,
  `CONNECTORS_SETTINGS_PAGE`. A host that skips the subpath never compiles `@semoss/connectors`.

## Minimal bundles and embedding

- **No dock**: omit `panelComponents` and `filePanels`; nothing loads the workbench shell or any
  file panel.
- **No connectors**: skip the subpath.
- **Shadow DOM**: pass `portalContainer` (an element inside the shadow root), so every menu,
  popover, dialog and tooltip portals there and picks up the embed's styles; scope the host's
  stylesheet to the shadow root.
- **History per surface**: give each embed its own `engine.roomScope` token, so it lists only the
  rooms it made.

## Verify

Run `pnpm --filter @semoss/chat test`, your host's tests and type-check (which compiles the
chat's sources), and a production build; then smoke a turn: new chat → first message → streamed
response → tool call → Files → save → export.
