# @semoss/chat

Shared chat components and headless chat logic for SEMOSS applications.
The package exports headless APIs from `@semoss/chat` and styled components
from `@semoss/chat/components`.

This is a **library**, not an app — you build it and other packages import
the built output.

## Quick Start

```tsx
import { InsightProvider } from "@semoss/sdk/react";
import { Chat } from "@semoss/chat/components";

function MyPage() {
    return (
        <InsightProvider>
            <Chat
                options={{
                    engineId: "test-engine-id",
                }}
                isActive
                placeholder="Ask me anything..."
            />
        </InsightProvider>
    );
}
```

`Chat` renders the full chat UI — message list, input, tool calls, file
attachments — with zero extra wiring. It creates a chat room on first send,
asks the model, and **streams the response token by token** (via
`runPixelAsync` + `getPixelJobStreaming` polling every 300ms, then a final
`getPixelAsyncResult` call). It auto-runs any tool call the model requests
(bounded by `toolAutoExecutionLimit`, default 3) before resolving.

The session is linear and does not expose message branching or editing
behavior.

## Prerequisites

- `<InsightProvider>` from `@semoss/sdk/react` must wrap any component using
  `Chat` or `ChatProvider`.
- Host app must import `@semoss/ui/globals.css` and have a `<ThemeProvider>`
  from `@semoss/ui/next` above the chat components.

## Entry Points

| Import | Description |
| --- | --- |
| `@semoss/chat` | Headless hooks, stores, and imperative APIs (no UI) |
| `@semoss/chat/components` | Styled React components (dot notation off `Chat`) |

## Usage

### Batteries-included

```tsx
import { Chat } from "@semoss/chat/components";

<Chat
    options={{
        engineId: "test-engine-id",
        workspaceId: "optional-workspace-id",
        defaultRoomSettings: {
            instructions: "Be concise.",
            temperature: 0.3,
        },
    }}
    agents={[
        {
            workspace_id: "support-agent-project-id",
            name: "Support Agent",
            description: "Answers product support questions",
            permission: "READ_ONLY",
        },
    ]}
    isActive
    placeholder="Ask me anything..."
/>
```

The optional `agents` prop adds fixed choices to the Agent tab. Fixed agents
are shown before agents discovered from `MyProjects`, are searchable, and are
deduplicated by `workspace_id`. Selecting one updates the active room's
workspace; if the room has not been created yet, that workspace is used when
the first message creates it.

### Custom layout (dot notation)

```tsx
import { ChatProvider, useChatContext } from "@semoss/chat";
import { Chat } from "@semoss/chat/components";

function CustomLayout() {
    const { messages, isTyping, sendMessage, mcp, setMcp } = useChatContext();

    return (
        <div className="flex h-full flex-col">
            <Chat.MessageList messages={messages} isTyping={isTyping} />
            <Chat.Input
                onSubmit={sendMessage}
                isGenerating={isTyping}
                mcp={mcp}
                onMcpChange={setMcp}
            />
        </div>
    );
}

function MyChat() {
    return (
        <ChatProvider
            options={{ engineId: "test-engine-id" }}
            isActive
        >
            <CustomLayout />
        </ChatProvider>
    );
}
```

### Headless (no UI)

```ts
import { createChatStore } from "@semoss/chat";

const { store, start, dispose } = createChatStore(actions, insightId, {
    engineId: "test-engine-id",
});

await start();

const { sendMessage } = store.getState();
await sendMessage("Hello!");

store.subscribe((state) => console.log(state.messages));

dispose();
```

## Dot Notation Components

All sub-components are accessed via `Chat.*`:

| Component | Description |
| --- | --- |
| `Chat` | Batteries-included chat (wraps provider + all UI) |
| `Chat.Input` | Message composer with file attach, slash commands, MCP |
| `Chat.MessageList` | Scrollable message history |
| `Chat.MessageBubble` | Single message renderer (text, thinking, tool calls) |
| `Chat.TypingIndicator` | Rotating status text with pulse animation |
| `Chat.ToolCallView` | Tool call card with running/success/error state |
| `Chat.EngineSelect` | Model/engine picker |
| `Chat.McpOverlay` | Knowledge/toolbox attachment dialog |
| `Chat.McpMenuButton` | MCP selector dropdown |
| `Chat.PromptLibraryDialog` | Prompt selection UI |
| `Chat.PromptOptimizer` | LLM-based prompt enhancement |
| `Chat.RoomsPage` | Full-page room history list |
| `Chat.RoomSidebar` | Room list sidebar |
| `Chat.RoomSettingsSidebar` | Room configuration panel |
| `Chat.FileEditorSidebar` | File viewer for attachment clicks |
| `Chat.ToolResponseSidebar` | Tool execution detail panel |
| `Chat.MessageFeedbackToolbar` | Thumbs up/down ratings |
| `Chat.SelectionChatButton` | Text selection → send to chat button |

### Component rendering details

- **`Chat.MessageBubble`** — renders a message's `parts` in order. User
  messages are a bubble (`bg-accent`); assistant messages have no background,
  flush against the page. `text` parts render as markdown/GFM, `thinking`
  parts as muted italic text, and `tool_call` parts render inline via
  `Chat.ToolCallView` with a real running/success/error state derived from
  whether a matching `tool_result` part exists yet.
- **`Chat.MessageList`** — composes `Chat.MessageBubble` + `Chat.TypingIndicator`
  for the gap before any content has streamed in (hidden once the streaming
  message has parts). Pass `renderMessage` to fully override per-message
  rendering.
- **`Chat.TypingIndicator`** — rotating status text ("Thinking through
  it...", "Working on that...", ...) with a pulse animation — not bouncing
  dots.
- **`Chat.ToolCallView`** — a bordered card with a status-specific icon badge
  (spinner/check/x). Takes `status="running" | "success" | "error"`.
- **`Chat.Input`** — uses a `<textarea>` and supports file attachment, prompt
  library, voice input, slash commands, MCP selection, room settings, and
  custom trailing actions.

## Chat Options

| Option | Description |
| --- | --- |
| `engineId` | Required model engine used by `AskPlayground` |
| `roomId` | Existing room to resume. Omit to create on first send. |
| `workspaceId` | Associate new room with a workspace |
| `defaultRoomSettings` | Initial `instructions` and `temperature`, persisted before the first ask |
| `toolAutoExecutionLimit` | Max tool-call rounds per message (default: 3) |
| `gracefulErrors` | Map error substrings to user-facing messages |

`allowedTools` currently exists in the `ChatOptions` type but is not enforced
by `ChatSession`. Tool availability is determined by the MCP sources attached
to the room and by backend tool discovery.

## Session State

```ts
const {
    messages,
    isTyping,
    error,
    roomId,
    engineId,
    isLoadingHistory,
    mcp,
    setEngineId,
    sendMessage,
    setMcp,
    recordFeedback,
    downloadMessage,
} = useChatContext();
```

Use a selector when a component needs only part of the store:

```ts
const isTyping = useChatContext((state) => state.isTyping);
```

`sendMessage(text, files?)` accepts text, files, or both. Files are uploaded
to the current insight and represented by `media` parts in the user message.
Other message part types are `text`, `thinking`, `tool_call`, and
`tool_result`.

`setMcp()` attaches knowledge sources and toolbox projects to the room. The
attachments are persisted through `UpdateRoomOptions` and used by the backend
when handling `AskPlayground`. When the model returns a tool call, the session
executes `RunMCPTool`, records the result, and sends it through
`AddPlaygroundToolExecution` so the model can continue.

## Imperative API

The imperative API lets you send messages and target chat sessions from
**completely outside React** — no hooks, no `useChatContext`, no component
tree. Common use cases:

- A background task (file upload complete, workflow step finished) wants to
  notify the active chat session
- A non-React part of your app (a vanilla JS widget, a browser extension
  content script) needs to post a message

```ts
import {
    sendToActiveChat,
    sendToActiveRoom,
    getActiveChatRoomId,
    registerChatStore,
    setActiveChatStore,
    setActiveChatRoom,
} from "@semoss/chat";
```

`ChatProvider` **automatically registers its store and marks it as active**
when it mounts — you don't need to call `registerChatStore` yourself for the
normal case. Just mount the provider and call the imperatives:

```tsx
// 1. Mount a provider somewhere in your app
<ChatProvider options={{ engineId: "test-engine-id" }}>
    <App />
</ChatProvider>

// 2. Call from anywhere — no React context needed
import { sendToActiveChat } from "@semoss/chat";

button.addEventListener("click", async () => {
    await sendToActiveChat("Summarise the selected text");
});
```

### Managing multiple sessions

When several `ChatProvider` instances are mounted at once (e.g. a sidebar
session and an inline assistant), the **last one to mount with
`isActive={true}` (the default)** becomes the active target. You can take
manual control:

```ts
import { setActiveChatRoom, sendToActiveRoom } from "@semoss/chat";

// Target a specific room by its ID
setActiveChatRoom(roomId);
await sendToActiveChat("Hello from outside React");

// Or send directly without changing the global active store
await sendToActiveRoom(roomId, "Hello from outside React");
```

### Polling the active room ID

```ts
import { getActiveChatRoomId } from "@semoss/chat";

const id = getActiveChatRoomId(); // null until the first message is sent
```

## Room Behavior

The chat supports a single active room. Once a room is created (on first
message send), room switching is disabled — `setActiveRoom()` and `newChat()`
are no-ops once `activeRoomId` is set.

## Room Management

`ChatRoomsProvider` and `useChatRoomsContext` expose paginated room state and
actions for searching, loading more, selecting, renaming, pinning, deleting,
refetching, and starting a new chat.

```tsx
import { ChatRoomsProvider, useChatRoomsContext } from "@semoss/chat";

function RoomCount() {
    const rooms = useChatRoomsContext((state) => state.rooms);
    return <span>{rooms.length} rooms</span>;
}

function Rooms() {
    return (
        <ChatRoomsProvider>
            <RoomCount />
        </ChatRoomsProvider>
    );
}
```

`Chat.RoomsPage` and `Chat.RoomSidebar` from `@semoss/chat/components`
provide ready-made room navigation UI.

## Integration Patterns

These patterns are deliberately **not exported** from the package — they're
opinionated about app-level layout and every host app will want to adapt
them. Copy, modify, and own them.

### Global chat sidebar

A layout wrapper that adds a persistent chat panel as a real flex sibling
(not an overlay) so it pushes content rather than covering it. Auto-opens
when a new message arrives — so calling `sendToActiveChat` from anywhere in
the app pops the panel open automatically.

```tsx
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useChatContext } from "@semoss/chat";
import { Chat } from "@semoss/chat/components";

export const GlobalChatLayout = ({ children }: { children: ReactNode }) => {
    const { messages, isTyping, sendMessage } = useChatContext();
    const [open, setOpen] = useState(false);
    const prevCountRef = useRef(messages.length);

    useEffect(() => {
        if (messages.length > prevCountRef.current) setOpen(true);
        prevCountRef.current = messages.length;
    }, [messages.length]);

    useEffect(() => {
        if (isTyping) setOpen(true);
    }, [isTyping]);

    return (
        <div className="flex min-h-screen">
            {open && (
                <div className="sticky top-0 flex h-screen w-80 shrink-0 flex-col border-r">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <span className="font-semibold text-sm">Chat</span>
                        <button onClick={() => setOpen(false)}>✕</button>
                    </div>
                    <Chat.MessageList className="min-h-0 flex-1 p-3" />
                    <div className="border-t p-3">
                        <Chat.Input
                            onSubmit={sendMessage}
                            isGenerating={isTyping}
                        />
                    </div>
                </div>
            )}
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
};
```

### Selection-to-chat button

`Chat.SelectionChatButton` works as a drop-in anywhere inside a
`ChatProvider`:

```tsx
import { Chat } from "@semoss/chat/components";

<ChatProvider options={{ engineId: "test-engine-id" }}>
    <Chat.SelectionChatButton />
    <App />
</ChatProvider>
```

When the user highlights text anywhere on the page, a floating pill button
appears above the selection. Clicking it calls `sendToActiveChat` with the
selected text and clears the selection.

**Props** — all optional:

```tsx
<Chat.SelectionChatButton
    label="Ask AI about this"
    icon={<SparklesIcon />}
    className="bg-primary text-primary-foreground border-primary"
    zIndex={9999}
/>
```

## Build

```bash
pnpm --filter @semoss/chat build       # production (Rollup → dist/)
pnpm --filter @semoss/chat build:dev   # no minification (faster iteration)
pnpm --filter @semoss/chat dev         # watch mode (rebuilds on file change)
```

The `dist/` folder is what other packages actually import (via `@semoss/chat`
and `@semoss/chat/components`). If you change source code under `src/` and
don't see it reflected elsewhere, rebuild.

### Type-check

```bash
pnpm --filter @semoss/chat type-check
```

Checks for TypeScript errors without emitting files.

## Project Structure

```
src/
├── components/   Styled React components (dot notation)
├── contexts/     React providers + hooks
├── stores/       Headless Zustand stores
├── transport/    Backend pixel call wrappers (AskPlayground, CreatePlaygroundRoom,
│                 RunMCPTool, AddPlaygroundToolExecution, UpdateRoomOptions, etc.)
├── lib/          Small utilities (date, clipboard, etc.)
├── chat-session.ts          Single-room session state machine
├── chat-rooms-session.ts    Room listing/selection state
├── chat-imperative.ts       Imperative API for non-React callers
├── chat-options.ts          ChatOptions contract
├── history.ts               Room history normalization
├── types.ts                 Shared types
└── index.ts                 Package entry point
```

Each folder above has its own README documenting what belongs there and the
naming convention to follow when adding new files.
