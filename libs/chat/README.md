# @semoss/chat

Shared chat state, transport, and React components for SEMOSS applications.
The package exports headless APIs from `@semoss/chat` and styled components
from `@semoss/chat/components`.

This is a **library**, not an app — there's nothing to "open in a browser"
here. You build it, and other packages (like `@semoss/playground`, once it
adopts this) import the built output.

## One-time setup

From the `semoss-ui` repo root (not from inside `libs/chat`):

```bash
pnpm install
```

This installs dependencies for every package in the monorepo, including this
one.

## Build

From the repo root:

```bash
pnpm --filter @semoss/chat build
```

Or from inside `libs/chat`:

```bash
pnpm build
```

This runs Rollup and writes compiled output to `libs/chat/dist/` — that
`dist/` folder is what other packages actually import (via `@semoss/chat`
and `@semoss/chat/components`). If you change source code under `src/` and
don't see it reflected elsewhere, it's almost always because you forgot to
rebuild.

`pnpm build:dev` does the same thing without production minification (faster,
useful while iterating).

`pnpm dev` runs Rollup in watch mode — it rebuilds automatically whenever a
file under `src/` changes. Leave this running in a terminal tab while you
work.

## Test

```bash
pnpm test
```

Runs the test suite once (via Vitest) and exits. `pnpm test:watch` reruns
tests automatically as you edit files — useful while writing a new
component.

Tests live next to the code they test, as `*.test.ts`/`*.test.tsx` files
(e.g. `src/components/message-bubble.test.tsx`).

## Type-check

```bash
pnpm type-check
```

Checks for TypeScript errors without emitting any files. Good to run before
opening a PR.

## What's here right now

**Headless (`@semoss/chat`)**

```tsx
import { ChatProvider, useChatContext } from "@semoss/chat";

function ChatContent() {
  const { messages, isTyping, error, roomId, sendMessage } = useChatContext();

  return (
    <div>
      <button
        type="button"
        disabled={isTyping}
        onClick={() => void sendMessage("Hello")}
      >
        Send
      </button>
      <div>Room: {roomId ?? "Not created yet"}</div>
      <div>Messages: {messages.length}</div>
      {error && <div>{error}</div>}
    </div>
  );
}

function MyChatWidget() {
  return (
    <ChatProvider
      options={{
        engineId: "your-engine-id",
        defaultRoomSettings: {
          instructions: "Be concise.",
          temperature: 0.3,
        },
      }}
    >
      <ChatContent />
    </ChatProvider>
  );
}
```

`ChatProvider` creates a chat room on first send, asks the model, and
**streams the response in token by token** — the same real streaming
mechanism playground's `RoomStore` uses (`runPixelAsync` +
`getPixelJobStreaming` polling every 300ms, then a final
`getPixelAsyncResult` call), not a one-shot request/response. It auto-runs
any tool call the model requests (bounded by `toolAutoExecutionLimit`,
default 3) before resolving. It requires the host app to already have
`@semoss/sdk/react`'s `<InsightProvider>` set up somewhere above it —
that's a hard prerequisite, not something this package provides.

The session is linear and does not expose playground's message branching or
editing behavior.

- `src/chat-options.ts` — the `ChatOptions` contract (`engineId`, `roomId`,
  `workspaceId`, `defaultRoomSettings`, `allowedTools`,
  `toolAutoExecutionLimit`, `gracefulErrors`).
- `src/chat-session.ts` — `ChatSession`, the vanilla Zustand-backed session
  that drives room creation, uploads, streaming, tool execution, feedback,
  downloads, and room synchronization.
- `src/stores/chat/chat-store.ts` — combines session state and bound actions
  into the public single-room Zustand store.
- `src/contexts/chat-provider.tsx` — exposes the store through `ChatProvider`,
  `useChatContext`, and `useChatStore`.
- `src/transport/pixel-calls.ts` — the underlying `AskPlayground`/
  `CreatePlaygroundRoom`/`RunMCPTool`/`AddPlaygroundToolExecution`/
  `UpdateRoomOptions` pixel calls and related room, upload, feedback, and
  download operations.
- `src/chat-imperative.ts` — tracks registered stores for non-React callers.
- `src/chat-rooms-session.ts`, `src/stores/chat-rooms/chat-rooms-store.ts`,
  `src/contexts/chat-rooms-provider.tsx` — room listing, selection, search,
  rename, pin, and deletion state.

### Project structure

```
src/
├── components/   UI components (see components/README.md)
├── contexts/     React providers + their hooks (see contexts/README.md)
├── stores/       Headless Zustand stores (see stores/README.md)
├── transport/    Pixel call wrappers used by stores/sessions
├── lib/          Small framework-agnostic utilities (date, clipboard, etc.)
├── chat-session.ts, chat-rooms-session.ts   Session state machines
├── chat-imperative.ts, chat-options.ts, history.ts, types.ts   Core contracts
└── index.ts, index.css   Package entry points
```

Each folder above with its own README documents what belongs there and the
naming convention to follow when adding new files — check it before adding a
new store, context, or component so new code lands in the right place.

### Chat options

`ChatProvider` and `ChatPanel` accept a `ChatOptions` object:

| Option | Description |
| --- | --- |
| `engineId` | Required model engine used by `AskPlayground`. |
| `roomId` | Existing room to load. When omitted, a room is created on first send. |
| `workspaceId` | Workspace associated with a newly created room. |
| `defaultRoomSettings` | Initial `instructions` and `temperature`, persisted before the first ask. |
| `toolAutoExecutionLimit` | Maximum tool-call rounds for one message. Defaults to `3`. |
| `gracefulErrors` | Maps substrings from backend errors to user-facing messages. |

`allowedTools` currently exists in the `ChatOptions` type but is not enforced
by `ChatSession`. Tool availability is determined by the MCP sources attached
to the room and by backend tool discovery.

### Session state

`useChatContext()` exposes the current session state and actions:

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

**Presentational (`@semoss/chat/components`)**

**These components depend on `@semoss/ui` directly** — that's a deliberate
choice to match playground's visual design. The host app must already have
`@semoss/ui/globals.css` imported (and typically a `<ThemeProvider>` from
`@semoss/ui/next` above it) — this package ships **no CSS of its own**.

The simplest possible drop-in — one component, wires everything together:

```tsx
import { ChatPanel } from "@semoss/chat/components";
// Your app's own entry point (or wherever it already imports @semoss/ui):
// import "@semoss/ui/globals.css";

function MyChatWidget() {
	return (
		<ChatPanel
			options={{
				engineId: "your-engine-id",
				workspaceId: "optional-workspace-id",
			}}
      agents={[
        {
          workspace_id: "support-agent-project-id",
          name: "Support Agent",
          description: "Answers product support questions",
          permission: "READ_ONLY",
        },
      ]}
			className="h-96"
			placeholder="Ask me anything..."
		/>
	);
}
```

The optional `agents` prop adds fixed choices to the Agent tab. Fixed agents
are shown before agents discovered from `MyProjects`, are searchable, and are
deduplicated by `workspace_id`. Selecting one updates the active room's
workspace; if the room has not been created yet, that workspace is used when
the first message creates it.

Or compose the pieces yourself if you need something `ChatPanel` doesn't do
(a header showing room info, a different layout):

```tsx
import { ChatInput, MessageList } from "@semoss/chat/components";
import { ChatProvider, useChatContext } from "@semoss/chat";

function ChatContent() {
  const { isTyping, sendMessage } = useChatContext();

	return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <MessageList className="min-h-0 flex-1" />
      <ChatInput
        onSubmit={sendMessage}
        disabled={isTyping}
        isGenerating={isTyping}
      />
		</div>
	);
}

function MyChatWidget() {
  return (
    <ChatProvider options={{ engineId: "your-engine-id" }}>
      <ChatContent />
    </ChatProvider>
  );
}
```

Shipped components match playground's message and composer patterns:

- `MessageBubble` — renders a message's `parts` in order. User messages are
  a bubble (`bg-accent`); **assistant messages are not a bubble at all** —
  no background, flush against the page, exactly matching
  `response-message.tsx`. `text` parts render as markdown/GFM, `thinking`
  parts as muted italic text, and `tool_call` parts render inline via
  `ToolCallView` with a **real** running/success/error state — derived
  from whether a matching `tool_result` part exists yet, not invented. An
  error status gets a bordered/tinted treatment using `@semoss/ui`'s own
  `destructive` tokens.
- `MessageList` — composes `MessageBubble` + a generic `TypingIndicator`
  for the gap before *any* content has streamed in yet (hidden once the
  streaming message has parts, since the message itself shows progress at
  that point). There's no separate floating tool indicator anymore — tool
  calls render inline via each message's own parts. Pass `renderMessage`
  to fully override per-message rendering.
- `TypingIndicator` — rotating status text ("Thinking through it...",
  "Working on that...", ...) with a pulse animation, copied verbatim from
  playground's `LOADING_MESSAGES` — not bouncing dots.
- `ToolCallView` — a bordered card (`rounded-lg border border-border
  bg-background`) with a status-specific icon badge (spinner/check/x),
  matching `response-message-tool-streaming.tsx`'s/`response-message-tool.tsx`'s
  card treatment. Takes `status="running" | "success" | "error"` — real
  states now that `ChatMessage.parts` actually carries this data.
- `ChatInput` — composer chrome matches `room-input.tsx` (`border-input`,
  `bg-card`, `shadow-lg`, `rounded-md`, focus ring) with `@semoss/ui`'s
  `Button` (`variant="default" size="icon-sm"`) as the send button.
  It uses a plain `<textarea>` and supports file attachment, prompt library,
  voice input, slash commands, MCP selection, room settings, and custom
  trailing actions.
- `ChatPanel` — batteries-included: creates a `ChatProvider` and wires
  `MessageList`, `ChatInput`, tool response details, and file editing together.

`lucide-react` (already a dependency of `@semoss/ui`, so nothing new to the
monorepo) supplies icons (`Spinner`'s `Loader2Icon`, `ChatInput`'s
`SendIcon`).

## Imperative API

The imperative API lets you send messages and target chat sessions from
**completely outside React** — no hooks, no `useChatContext`, no component
tree. The common use cases are:

- A background task (file upload complete, workflow step finished) wants to
  notify the active chat session
- A non-React part of your app (a vanilla JS widget, a browser extension
  content script) needs to post a message
- An E2E test wants to drive the chat without simulating UI events

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

`ChatProvider` (and `ChatPanel`, which wraps one) **automatically registers
its store and marks it as active** when it mounts — you don't need to call
`registerChatStore` yourself for the normal case. Just mount the provider
and call the imperatives:

```tsx
// 1. Mount a provider somewhere in your app
<ChatProvider options={{ engineId: "your-engine-id" }}>
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

---

## Room management

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

`ChatRoomsPage` and `ChatRoomsShell` from `@semoss/chat/components` provide
ready-made room navigation and chat layouts.

## Integration patterns

These patterns are deliberately **not exported** from the package — they're
opinionated about app-level layout and every host app will want to adapt
them. Copy, modify, and own them.

### Global chat sidebar

A layout wrapper that adds a persistent chat panel as a real flex sibling
(not an overlay) so it pushes content rather than covering it. Wires
`useChatContext` for the live message feed and auto-opens whenever a new
message arrives — so calling `sendToActiveChat` from anywhere in the app
pops the panel open automatically.

```tsx
// components/global-chat-layout.tsx
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useChatContext } from "@semoss/chat";
import { ChatInput, MessageList } from "@semoss/chat/components";

export const GlobalChatLayout = ({ children }: { children: ReactNode }) => {
  const { messages, isTyping, sendMessage } = useChatContext();
  const [open, setOpen] = useState(false);
  const prevCountRef = useRef(messages.length);

  // Auto-open when a new message arrives (e.g. via sendToActiveChat)
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
          <MessageList className="min-h-0 flex-1 p-3" />
          <div className="border-t p-3">
            <ChatInput onSubmit={sendMessage} isGenerating={isTyping} />
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

// App.tsx — wrap your router
<ChatProvider options={{ engineId }}>
  <GlobalChatLayout>
    <Router />
  </GlobalChatLayout>
</ChatProvider>
```

Things you'll likely adapt: panel side (left vs right), width, header
content, open/close trigger, animation.

### Selection-to-chat button

`SelectionChatButton` **is exported** from `@semoss/chat/components` — it
requires no layout coupling and works as a drop-in anywhere:

```tsx
import { SelectionChatButton } from "@semoss/chat/components";

// Drop inside your ChatProvider — no other wiring needed
<ChatProvider options={{ engineId }}>
  <SelectionChatButton />   {/* highlight any text → pill button appears */}
  <App />
</ChatProvider>
```

When the user highlights text anywhere on the page, a floating pill button
appears above the selection. Clicking it calls `sendToActiveChat` with the
selected text and clears the selection. The button disappears automatically
when the selection is cleared.

**Props** — all optional:

```tsx
<SelectionChatButton
  label="Ask AI about this"        // default: "Send to chat"
  icon={<SparklesIcon />}           // default: MessageSquareTextIcon; pass null to hide
  className="bg-primary text-primary-foreground border-primary"  // merged onto pill
  zIndex={9999}                     // default: 9999
/>
```

The button uses `onMouseDown` + `preventDefault` internally so the selection
is never cleared before the text is captured — no special handling needed on
your side.
