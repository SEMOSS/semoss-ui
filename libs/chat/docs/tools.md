# Tools in a chat

> Part of the [chat guide](../AGENTS.md). Default folder tools, desktop folders, client tools, tool views, and the files queued for the next message. Read it before changing `features/tools/`, `features/local-folders/`, `features/room-settings/tools/`, or `features/conversation/attachments/`.

## Chat tools

`features/tools/chat-tools/` and `features/tools/chat-tools/` give a chat its default file tools,
and `features/room-settings/tools/` the Tools section of Settings.
`RoomStore.chatTools` (`ChatTools`) owns them per room. These details are easy to break:

- **Room Files is the room's file space; desktop folders sit beside it.** Room Files is the room's own folder: uploads, connector
  downloads, and everything the room's apps (MCP tools) and the default tools read and write. Files in
  the room header opens the file explorer on it. Its Add to Context action uses
  `FileExplorerHostProvider` and queues on `useNextMessageRoom() ?? room`, so files selected from
  a prepared new room appear in the new chat's composer and transfer before its first message.
- **A chat gets default tools; an agent brings its own.** In chat mode every message carries the
  default tools, the `folder_*` tools the browser runs in Room Files (`chat-tools/default-tools.ts`).
  Room Settings sets each to Auto, Ask, or Disabled (room option `defaultTools`; reads are Auto
  and changes Ask unless set); a disabled tool is not sent. The option is saved with the room's
  other options as the next message starts (`RoomStore.updateRoomOptions` skips a save the
  backend already holds); the backend only stores it. Agent runs bring the harness's
  own file, shell, and code tools and work in Room Files, so no folder tools go with them.
- **Default tools run in the browser.** `ChatTools.runChatTool` runs each call against Room
  Files through the insight asset pixels (`chat-tools/room-folder.ts`), so the mode the user
  picked holds however the model asks.
- **Chat turns send the tools in `paramValues.tools`, twice.** `AskPlayground` carries them, and so
  does every `AddPlaygroundToolExecution` (`tool-save-controller.ts`): the model's follow up call
  only re-adds the room's own tools, so leaving them off drops them mid-task. The model's calls
  come back with no `_meta`; a call's `json` gets it from `ChatTools.decorateToolCall`, and
  `ChatTurnRunner`'s tool loop hands folder calls to `ChatTools.runChatTool` instead of
  `RunMCPTool`.
- **Settings shows what the assistant has.** Its Tools section (`RoomSettingsForm`) has Add
  Tools beside its heading, then up to four groups that all work the same way
  (`RoomToolsSection`: a collapsible header with an info tooltip in place of a description, the
  number of rows, and any actions, over one bordered list). Every tool is the same row
  (`ChatToolRow`: title, opening to its definition and parameters, with a fixed-width mode column
  at the end); group rows (`ToolGroupRow`) keep an action slot so counts line up, and loading,
  error, and empty states are list rows in a `ToolList`. **Default** sets each default
  tool's mode in its rows' mode column, or notes that an agent room's runs bring their own. **Connectors** is the room's own
  toolbox (`RoomToolsConnectorsSection`, read from `mcp/pixel_mcp.json`, by connector service, with sign
  in notices and Manage Connectors, which opens the settings dialog). **Agent** and **Toolboxes**
  (`RoomToolsToolboxesSection`) list the agent's toolboxes and the ones the user added, each read with
  `GetMCPTools` the first time it opens (`useToolboxTools`); either is left out when empty, and the
  room's own toolbox entry is never listed there. Settings opens through
  `ChatTools.openRoomSettings`; there is no separate Chat Tools panel.
- **An agent's tools are never in the room's options.** The backend adds them to every turn
  from the room's `options.workspace`, so `options.mcp` holds only the room's own, and
  `RoomStore.agentTools` holds the agent's, read with `getWorkspace` when the room loads and
  whenever its agent changes (a draft, which has no insight, is handed them by `NewChat` through
  `setAgentTools`). Where the UI lists both, it builds the list with `listRoomTools`
  (`tools/mcp/mcp-utils.ts`): the agent's first, then the room's whose id is not the agent's.
  Components read an agent with `useAgentWorkspace` (`tools/mcp/use-agent-workspace.ts`).
- **Never send `DeleteInsightAssets` an empty path.** With no path it clears the whole space.
  `RoomFolder` (`tools/chat-tools/room-folder.ts`) refuses to address its root for writes, moves, and deletes. The room
  folder also hides and refuses its `mcp` folder, where the room's tools are kept: rewriting it
  would switch the chat's tools and connectors off.
- **Room tools that ask need the chat tool card.** `GetMCPTools` cannot resolve the room toolbox,
  so the default tool form has no schema for them. `ToolsView` and the inline tool area render
  `ChatToolCard` for folder and connector calls instead (`isChatToolCall`). In a chat room its
  Allow and Deny go to `ChatTools`, and an allowed connector call runs through
  `ResponseMessageStore.runMcpToolCall`, the same run and save the tool loop uses for every MCP
  tool. In an agent room a connector call's Allow and every Deny go to `decideAgentToolAction`
  instead, since the paused run resumes on the decision.

## Desktop folders

A host that can reach the user's own files passes a `LocalFoldersHost` as
`ChatConfig.localFolders`; `useCreateChatStore(config)` hands it to every `RoomStore`
(`RoomStoreOptions.localFolders`). Only the desktop app does; elsewhere `room.localFolders` is
null and nothing below renders. These details are easy to break:

- **The chat never sees a path on the machine.** A folder is a `LocalFolder` (`id`, `name`) the
  host attached through its own picker (`pick`) and keeps per room; a file is a path inside it.
  `RoomLocalFoldersStore` loads them with the room, once its mode is known, and listens to each
  (`watch`), so a change made in another app emits `FILES_CHANGED` for the folder's `MOUNT` scope.
- **Files lists them under Desktop.** `RoomWorkbench` wraps the dock in `FileSourcesProvider`
  with `useRoomFileSources`: Room Files' own tree, then a Desktop group (Attach Folder, and each
  folder's menu: Show in Finder, Detach). Desktop files' rows add Open with Default App, Show in
  Finder, and Add to Context, which uploads a copy to Room Files, since a message's `media` is a
  path there. The composer's plus menu has Attach Folder too. In a new chat it prepares the
  draft's room, as Files does (`useNewRoomPanels`' `onAttachFolder`), attaches to it, and opens
  its Files; the first message carries the folders' tools (an agent room's are written with
  `RoomStore.syncClientTools` before it sends), and a draft left unsent detaches them with its room.
- **The tools are `desktop_*`, offered as client tools.** The same operations, limits and edit
  logic as `folder_*` (`folder-tools.ts`, over a `ToolFolder`), on `DesktopFolders`, where each
  folder is a top level entry by its name. A tool never writes, moves or deletes a folder itself,
  nor moves between folders. Each follows the room's `defaultTools` setting for the `folder_*`
  tool that does the same (`getMatchingFolderTool`), so reads run on their own and changes ask
  unless set. The rest of the chat treats them as client tools (below).

## Client tools

A client tool is one a host runs in this browser rather than on the server: today the desktop
app's `desktop_*` tools; a host such as the Chrome extension adds its own the same way. Names in
the chat say "client" (`clientToolDefinitions`, `syncClientTools`, `answerAgentClientCalls`,
`tools/chat-tools/`); a host's own tools keep its name (`desktop_*`, `DesktopFolders`).

- **A chat room sends them; an agent room keeps them in its toolbox.** A room keeps its mode, so
  each uses one way: a chat turn sends `ChatTools.clientToolDefinitions` in
  `paramValues.tools` with the default tools and the browser runs them like the folder tools.
  An agent run brings no browser tools but offers the room's own toolbox, so
  `RoomStore.syncClientTools` writes them into `mcp/pixel_mcp.json` (`mergeRoomClientTools`),
  stamped `PlaygroundClientTools`, each `ask` with `SMSS_CLIENT_TOOL`, through
  `updateRoomToolFile`, which runs one write at a time with the connectors'. The run pauses on
  every call; `ChatTools.answerAgentClientCalls` runs the ones the settings let run on
  their own and resumes the run with `respond`, and Allow does the same for the rest. Each paused
  call is answered once.
- **A room opened where its host is not** (the web app, another machine) answers a client tool
  call with an error saying so, so an agent run never waits on it.

## Tool views

`features/tools/views/` draws tool calls whose `SMSS_MCP_UI.resourceURI` is
`component://<library>/<view>`, with the views `@semoss/connectors` provides
(`TOOL_VIEW_LIBRARIES`: `mail` and `calendar`), in the page and never in a frame. `RoomScope`
mounts `ToolViewProvider` around the conversation workspace, so the conversation and the Workspace
both find them.

- **Routing.** `ToolsView` and `ResponseMessageTool` give a call, in order: folder calls
  their `ChatToolCard`; a `component://` view the playground draws, `ComponentToolView`; then
  `system://` apps, portal pages, and the default form. A `component://` URI is never turned into
  a portal URL, and its project or engine is not looked up. A call whose view the playground does
  not draw, or whose view fails, shows the card it would have without one.
- **Where.** In the conversation an approval sizes to its form and a result is kept to a bounded
  height; in the Workspace the view fills its tab. Once a decision is made the view shows the result,
  even before an agent run's next update, so a call is not decided twice. `RoomScope` provides
  the room (`RoomProvider`) to the conversation as well as the Workspace, since a view saves into
  the room's files. Connector calls that ask open inline, as their cards do.
- **Decisions** (`tool-view-decisions.ts`). In an agent run they decide the run's pending
  action: approve (`submit`, an edit when the arguments changed), reject, or `respond` with what
  the user did instead. In chat, approving sets the call's parameters to the edited arguments and
  runs it through the room's toolbox, declining goes through `ChatTools.declineChatTool`, and
  responding saves the outcome as the call's result, which hands it to the model.
- **The call** (`tool-view-call.ts`). The view gets the reactor (`SMSS_FUNCTION_NAME`), the
  arguments, the result (a failed call's details, without the model's guidance,
  `readToolResponseDetail`), and whether the call waits for the user.
- **The host** (`use-room-tool-view-host.ts`). Saves land in Room Files and add to the next
  message through `useRoomConnectorHost`, signing in to the account the URI's `provider` names.
- **Framed pages.** A portal or declared page is framed from `ChatConfig.toolFrameOrigin` when
  the host gives one (the desktop app's second local origin), so the page cannot script chat UI.
  It and chat UI talk only by `postMessage`: `ToolsView` sends the call (`SMSS_INIT_TOOL`), and
  `useToolViewMessageBridge` takes a result (`SMSS_EXEC_TOOL`) only from the frame showing that
  call, which `ToolsView` marks with `data-tool-call-id`.

## Files queued for the next message

`RoomStore.contextItems` (`ContextItemsStore`, `features/conversation/attachments/context-items.store.ts`)
holds the files queued for the room's next message, each already in Room Files: a connector viewer
saved it there, or the user picked it in Room Files. `ContextItems` shows them as chips in the
input. `RoomStore.askMessage` sends them as `media` with the next message the user sends, and puts
them back on the queue when the send fails. `NewChat` queues on its draft through
`NextMessageRoomProvider` (`next-message-room.context.tsx`), and the room it creates takes the
queue with `ContextItemsStore.adopt` before its first message.
