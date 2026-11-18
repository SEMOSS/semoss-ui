# The room Workspace

> Part of the [chat guide](../AGENTS.md). The right-hand dock: who owns its store, how panels open, and the slash menu that lists them. Read it before changing `features/workbench/`, `features/room/layout/`, `features/new-chat/`, or the room's Workbench controller.

The right-hand panel is called **Workspace** in user-facing copy and is a `@semoss/workbench` dock. These details are not obvious from the
code and are easy to undo by accident:

- **The dock store belongs to `RoomStore`, not to `<Workbench>`.** Tools open panels from outside
  React and while the Workspace is closed, and the arrangement has to survive closing it — which
  unmounts the shell. `RoomStore`'s Workbench controller (`RoomWorkbenchController`) builds the store and
  restores its arrangement when the room is built; `<WorkbenchProvider store={room.workbench}>`
  only hands it down.
- **Blueprints are handed to `RoomStore`, not registered later.** They reach into the chat's
  components, which import its stores, so the store cannot import them without closing a module
  cycle. The
  composition root passes them instead: `useCreateChatStore` (the host's
  `ChatConfig.components.WorkbenchPanels`, or `DEFAULT_WORKBENCH_PANEL_COMPONENTS`) → `ChatStore` →
  `RoomStore`, and `NewChat` builds its draft with the store's (`chat.panelComponents`). They have
  to be in place before the first `openWorkbenchPanel`, which for a streaming tool is long before
  anything mounts — without them the dock falls back to a shallow compare of config, and since a
  file panel's `mode` is a fresh object per call, every open would spawn another tab.
- **`RoomWorkbench` uses the room's stable `workbenchSnapshot`.** Each new room builds its own from
  `createRoomWorkbenchLayout`; a prepared room adopts the draft's arrangement through
  `restoreWorkbenchLayout` before its first Workspace mount. The shell must use the same snapshot
  reference so mounting it does not reset tabs opened since initialization. The arrangement is
  owned by the room instance and is not persisted between room sessions.
- **A restored file panel is re-pointed at the room's live insight.** A room binds to a fresh
  insight on every load, and a file panel's `mode.insightId` is what its reads and saves run
  against. `RoomWorkbenchController.syncFileMode` (`room-workbench-controller.ts`) rewrites them once, before
  anything mounts.
- **The Workspace opens on Files and Settings, as tabs.** `createRoomWorkbenchLayout` seeds its
  main tabset with the two of them, Files in front. Both close like any other tab — the rail
  reopens them — which is why the tabset sets `enableDeleteWhenEmpty: false`: the dock would
  otherwise prune its only container and have nowhere to put the next panel. An empty Workspace
  stays open, showing its rail. Nothing docks in a border: the dock's
  four borders hold no panels at all. A new chat's draft is built with `includeFiles: false`,
  since it has no insight for Files to read; the room it prepares gains Files in
  `RoomStore.restoreWorkbenchLayout`, behind whatever tab the draft was on. A subscription to
  `ConnectorsStore` (`RoomWorkbenchController.closeHiddenConnectorPanels`) closes a viewer whose connector the chat can
  no longer show.
- **Every panel opens from the Workspace's panel rail.** `RoomWorkbenchRail`
  (`features/workbench/rail/room-workbench-rail.tsx`) is the host's own chrome in the dock's **left**
  border slot (`borderSlots.left.before`): the room's cog menu, a divider, then the icons of
  `ChatConfig.components.WorkbenchRail`, or `DefaultWorkbenchRail`: one `RailItem` per entry of
  `useWorkbenchPanels`, each with its label on hover. A host's rail reads the room and those
  panels with `useWorkbench()`. Its `side` prop is `"right"` on that rail,
  so labels and the menu open into the dock rather than over the conversation. A click goes through the option's
  `onOpen` → `openWorkbenchFileExplorer` / `openRoomSettings` / `openSourcePanel` / `openWorkbenchPanel`
  → `selectPanel`, which **selects** the panel when it is already open anywhere in the dock and
  **adds** a tab to the main area when it is not. Connector viewers are not opened in advance;
  they open the first time they are asked for. An icon is also a **drag source**
  (`writeSpawnDragSpec`, from a `RailItem`'s `panel`), so dropping one on the
  dock opens that panel where it lands — the centre, or beside a tab as a split. A new chat's
  rail does not drag: its panels have to prepare the draft's room first, which only `onOpen` does.
- **The Workspace opens on its share of the row.** `RoomLayout` gives it
  `WORKBENCH_DEFAULT_SIZE`; once the user drags the divider, the pane keeps their size for as
  long as the page is mounted. There is no fit-to-content width any more — the main area always
  holds tabs. `RoomFrame` (an open room) and `NewChat` (its draft) pass `RoomLayout` the room's
  `workbenchPane.isOpen` and `closeWorkbench` directly.
- **Dragging the divider to the right edge closes the Workspace.** `RoomLayout`'s
  `onWorkbenchCollapse`, which `RoomFrame` and `NewChat` point at `room.closeWorkbench()`, closes it, and
  it reopens on its share again. The conversation does not collapse.
- **The Workspace has no top strip.** `RoomWorkbench` passes the workbench one border slot, the
  panel rail on the right, so its tab row is its top edge. The mobile layout has no rails, so
  there the same rail runs across `top.before` with `mobileTopBorder="toolbar"`, above the tabs,
  its labels opening downward; the mobile drawer still switches between open panels. The rail shows
  only while the Workspace is open. A new chat hands `RoomWorkbench` its `NewRoomWorkbenchPanels`,
  so a panel opened from the rail prepares the room (and its insight) as the toggle does. The header's last icon toggles it (`RoomWorkbenchToggle`, which
  opens it as it was left and brings it forward behind the narrow Chat tab), and Close Workspace
  is also in the slash menu; Publish as Agent is in the rail's cog menu and the slash menu
  (`RoomActionsProvider` renders a controlled `SaveAgentDialog`), so a new chat publishes
  only once it is a room.
  The per-panel control — "open inline" — is registered by the tool panel with
  `useWorkbenchControl`.
- **The room header holds the room's name.** `features/room/header/room-header.tsx` is
  one narrow row in `RoomLayout`'s `header` slot. It floats over the top of the
  conversation with no border, blurring what scrolls beneath it once the conversation reports
  it has scrolled (`ConversationScrollContext`), so an open Workspace takes the full height beside it;
  on narrow screens with the Workspace open it sits above both panes. At its start a room's name (`RoomTitle`, which renders `RoomName`); its actions (Favorite, Rename, Publish,
  Download, Delete, listed once by `useRoomActionItems` in `features/room/actions/`) are a row of
  the cog menu at the head of the Workspace's rail (drawn by `RoomWorkbenchRail` itself, which
  leaves out Rename and draws no cog outside a `RoomActionsProvider`, which is how a new chat
  leaves it out);
  `RoomList` shares their favorite and rename helpers (`toggleRoomFavorite`,
  `renameRoom`). Rename is no menu item: a double-click on the name edits it in place, in the
  header and in the sidebar (where F2 on a row does too), and `/rename` in the slash menu starts it
  through `RoomActionsProvider.startRenaming`. A new chat has no title and no Room section. Before the name it holds the
  host's `leading` controls: the playground puts its navigation button there
  (`PageHeaderNavigation`), the desktop app its sidebar toggle.
- **The header has no quick icons, and there is no ⋯ menu.** `features/room/header/room-header.tsx`
  ends the header with the Workspace toggle alone. What the menu used to hold now lives where it
  belongs: the panels are the rail, the room's own actions are the cog at its head, and the
  settings dialog's Connectors page is reached from Settings' Connectors section (Manage
  Connectors) or the user menu. `useWorkbenchPanels` builds the panel list for a room, or through
  `NewRoomWorkbenchPanels.onOpenPanel` for a new chat, and every panel's `onOpen` also calls
  `RoomLayoutActionsContext.revealWorkbench`. Each panel has a short label, the same on the rail,
  its tab, and the slash menu.
- **The layout is not cached.** Each new `RoomStore` starts from `createRoomWorkbenchLayout`,
  so switching rooms cannot bleed panel state between room instances.

New chats keep draft settings in their temporary room store. Opening Settings shows them
without creating a server room. Settings
uses the same workbench shell as Files. Files, the activity log, and connector viewers share `useNewRoom` to prepare one room lazily
and transfer the draft's arrangement before opening their panels; a failed preparation opens the Workspace on its error, whose Retry opens the same panel again. Connector viewers queue
attachments on the draft through `NextMessageRoomProvider` until the first message. `DraftSettingsContext` keeps Settings and publishing
bound to the current draft until submission, including after preparation. A draft's Settings
leave out the room's own toolbox until its first message. Selecting Chat clears agent
inheritance but preserves locally added Knowledge and Tools.

A draft's mode is the user's choice from the composer menu (the `enableAgentHarness` theme flag),
unless the theme's `modeFollowsAgent` flag is on. Then the agent picker decides it: a saved agent
or Default Agent runs in agent mode, and No Agent runs in chat mode, so picking No Agent is how
Default Agent is removed. The menu shows no Chat and Agent choice and the `/agent-harness`
command is left out (`canChooseAgentMode`, `features/conversation/composer/agent-mode-choice.ts`).
The composer, Settings and the picker all take the chat's `ComposerSession`
(`conversation/composer/use-composer-session.ts`): a room's from `useComposerSession`, a new chat's
from `useDraftAgent` (`new-chat/use-draft-agent.ts`). Its `agent` is an `AgentChoice`
(`tools/mcp/agent-choice.ts`): `fixed` in a room, `saved` in a new chat, and `savedOrDefault`
with the flag, where `MCPOverlay` and `AgentSelector` offer No Agent and Default Agent as separate
choices. A picker's save reaches either through `applyAgentOverlaySave`. A room keeps the mode it
was created with.

Whatever the theme, a chat in agent mode with no saved agent runs Default Agent, and the input
shows a Default Agent chip beside the add button: editable in a new chat, where it opens the
agent picker and the menu's agent item reads "Agent: Default Agent", and read-only in an
existing room.

Panel ids and the Workspace's default layout live in `features/room/store/room-workbench-layout.ts`; the room's own
blueprints live in `features/workbench/`, and a feature's (the connector viewers) live in its
folder. `features/workbench/panels/room-panel-components.ts` registers them all. Changing a panel type string
affects only the current room instance.

## Slash menu

`/` in the composer lists the commands its slot places (`features/conversation/composer/slash-command/`):
the host's `ChatConfig.components.SlashCommands`, or `DefaultSlashCommands`. Each command is a
`SlashCommand`, which draws nothing and registers itself while it is mounted; the composer's
`SlashCommandRegistryProvider` keeps them in a `StoreState` and lists them in the order they are
placed. The default's groups are Chat (`ComposerCommands`: attach, knowledge, tools, agent, mode,
compact), Workspace (`WorkspaceCommands`: each of `useWorkbenchPanels`' panels that can open now,
its connector viewers, and Close Workspace), Room (`RoomCommands`: `useRoomActionItems`, inside
the `RoomActionsProvider` that `RoomScope` mounts), and Prompts (the room's predefined prompts).
It matches the query against each command's name, label, and keywords, which keep the old
command names, and sorts by group. A command that cannot run is not placed: the mode commands
show only in a new chat whose theme offers the choice (`canChooseAgentMode`), since a room keeps
its mode, and Compact only in a room. Commands read the composer with `useComposer()`.
