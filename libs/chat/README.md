# @semoss/chat

Shared chat components and headless chat logic for SEMOSS apps. See
[`docs/chat-components/PLAN.md`](../../docs/chat-components/PLAN.md) at the
repo root for the architecture/plan this package implements.

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

## Preview the components (`pnpm sandbox`)

```bash
pnpm --filter @semoss/chat sandbox
```

Opens a local-only Vite dev page at `http://localhost:4300` rendering every
component with sample data — no backend, no `InsightProvider` needed. Loads
`@semoss/ui/globals.css` and wraps everything in `@semoss/ui/next`'s
`ThemeProvider` (`defaultTheme="light"`) so it renders with the real theme,
not an invented one. Edit anything under `src/components/` or
`sandbox/App.tsx` and it hot-reloads.

This exists instead of Storybook — see `docs/chat-components/PLAN.md`
("Storybook — investigated, decided against") for why: it was already
tried on `libs/ui` and removed wholesale across the whole monorepo. This
sandbox is a throwaway dev tool, not shipped, and not part of `pnpm build`.

## What's here right now

**Headless (`@semoss/chat`, Phase 1 — done)**

```tsx
import { useChat } from "@semoss/chat";

function MyChatWidget() {
	const { messages, isTyping, error, sendMessage } = useChat({
		engineId: "your-engine-id",
		defaultRoomSettings: { instructions: "Be concise.", temperature: 0.3 },
	});

	// render messages/isTyping/error however you want — this hook has no
	// opinion on UI at all. Call sendMessage(text) on submit. Each message
	// is `{ id, role, parts, status, timestamp }` — `parts` is a sequence of
	// typed pieces (text/thinking/tool_call/tool_result), not flat text, so
	// a single assistant turn can think, call a tool, and answer as one
	// message — matching playground's real structure.
}
```

`useChat(options)` creates a chat room on first send, asks the model, and
**streams the response in token by token** — the same real streaming
mechanism playground's `RoomStore` uses (`runPixelAsync` +
`getPixelJobStreaming` polling every 300ms, then a final
`getPixelAsyncResult` call), not a one-shot request/response. It auto-runs
any tool call the model requests (bounded by `toolAutoExecutionLimit`,
default 3) before resolving. It requires the host app to already have
`@semoss/sdk/react`'s `<InsightProvider>` set up somewhere above it —
that's a hard prerequisite, not something this package provides.

Deliberately out of scope for this first pass: message branching/editing
(playground's `RoomStore` supports this via a message tree; this hook is
linear-only, matching what `provider-portal-hpp`'s hand-rolled chatbot
already does — see `docs/chat-components/PLAN.md`).

- `src/chat-options.ts` — the `ChatOptions` contract (`engineId`,
  `defaultRoomSettings`, `toolAutoExecutionLimit`, `gracefulErrors`).
- `src/chat-session.ts` — `ChatSession`, the MobX store that actually drives
  the ask → stream chunks into the message's parts → tool-call-loop →
  finalize flow. Not exported publicly; `useChat` is the supported entry
  point.
- `src/transport/pixel-calls.ts` — the underlying `AskPlayground`/
  `CreatePlaygroundRoom`/`RunMCPTool`/`AddPlaygroundToolExecution`/
  `UpdateRoomOptions` pixel calls (`askPlayground`/
  `addPlaygroundToolExecution` stream; the rest are one-shot), generalized
  from `provider-portal-hpp`'s hand-rolled `ChatBotPixelCall.ts` and
  playground's real `RoomStore.runRoomPixelStreaming`.
- `src/use-chat.ts` — bridges the MobX store to plain React re-renders
  (including in-place mutations like appending streamed text, via a
  `revision` counter — not just `messages.length`), so a consumer never
  needs to know MobX is involved or wrap in `observer()`.

**Presentational (`@semoss/chat/components`, Phase 2 — done, Phase 3 — done)**

**These components depend on `@semoss/ui` directly** — that's a deliberate
reversal of an earlier decision (self-contained, no `@semoss/ui` dependency)
once matching playground's actual visual design became the goal; see
`docs/chat-components/PLAN.md`'s "Design approach" section for the full
reasoning. Practically, this means the host app must already have
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
			options={{ engineId: "your-engine-id" }}
			className="h-96"
			placeholder="Ask me anything..."
		/>
	);
}
```

Or compose the pieces yourself if you need something `ChatPanel` doesn't do
(a header showing room info, a different layout):

```tsx
import { ChatInput, MessageList } from "@semoss/chat/components";
import { useChat } from "@semoss/chat";

function MyChatWidget() {
	const { messages, isTyping, sendMessage } = useChat({ engineId: "..." });
	return (
		<div className="flex h-full flex-col gap-2">
			<MessageList messages={messages} isTyping={isTyping} className="flex-1" />
			<ChatInput onSubmit={sendMessage} disabled={isTyping} />
		</div>
	);
}
```

Shipped, matching playground's real design (not an invented one — see
PLAN.md for the exact values pulled from `response-message.tsx`,
`input-message.tsx`, `response-message-tool*.tsx`, `room-input.tsx`):

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
  **Deliberately still a plain `<textarea>`**, not playground's Lexical
  rich-text editor (file attach, MCP menu, prompt library) — that's out of
  scope, not something this component approximates.
- `ChatPanel` — batteries-included: calls `useChat()` itself and wires
  `MessageList` + `ChatInput` together.

`lucide-react` (already a dependency of `@semoss/ui`, so nothing new to the
monorepo) supplies icons (`Spinner`'s `Loader2Icon`, `ChatInput`'s
`SendIcon`).
