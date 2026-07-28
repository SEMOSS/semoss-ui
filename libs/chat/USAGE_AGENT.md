---
description: "Use when implementing or integrating @semoss/chat in this codebase. Covers batteries-included Chat usage, custom ChatProvider composition, imperative APIs (sendToActiveChat/sendToActiveRoom), and component-level wiring like Chat.Input, MessageList, and SelectionChatButton."
name: "Chat Library Agent"
tools: [read, search, edit, execute]
argument-hint: "Describe the chat feature, which entry point you want (@semoss/chat or @semoss/chat/components), and whether you need imperative messaging"
user-invocable: true
---

# USAGE_AGENT.md - @semoss/chat

Practical guide for both humans and AI agents using this package.

## What this package exports

- `@semoss/chat`: headless state/session APIs (stores, providers, hooks, imperative helpers)
- `@semoss/chat/components`: styled React UI components via `Chat` dot notation

## Prerequisites (required)

1. Wrap usage with `InsightProvider` from `@semoss/sdk/react`.
2. Load `@semoss/ui/globals.css` in the host app.
3. Use `ThemeProvider` from `@semoss/ui/next` above chat UI.

If these are missing, chat can render incorrectly or fail at runtime.

## Provider rule (important)

- `Chat` from `@semoss/chat/components` already wraps `ChatProvider` internally.
- You only add `ChatProvider` yourself when composing headless/custom layouts
    with `useChatContext`, `Chat.MessageList`, `Chat.Input`, etc.

## Recommended import rules

- Import `cn` from `@semoss/ui`.
- Import date/clipboard helpers from `@semoss/shared`.
- Do not recreate local shims for shared/ui utilities in this package.
- Only `src/transport/*` should call `@semoss/sdk`.

## Example A (recommended, uses the package's broadest surface)

Use `Chat` first. It already composes most of this package's UI building
blocks internally (`MessageList`, `MessageBubble`, `ChatInput`, tool/file
sidebars, room settings, MCP overlays, and feedback tooling).

```tsx
import { InsightProvider } from "@semoss/sdk/react";
import { Chat } from "@semoss/chat/components";

export function Page() {
    return (
        <InsightProvider>
            <Chat
                options={{
                    engineId: "your-engine-id",
                    workspaceId: "optional-workspace-id",
                    defaultRoomSettings: {
                        instructions: "Be concise and cite sources.",
                        temperature: 0.2,
                    },
                    toolAutoExecutionLimit: 3,
                }}
                agents={[
                    {
                        workspace_id: "support-agent-project-id",
                        name: "Support Agent",
                        description: "Handles product support Q&A",
                        permission: "READ_ONLY",
                    },
                ]}
                renderMessage={(message, helpers) => (
                    <Chat.MessageBubble
                        message={message}
                        onRate={helpers.onRate}
                        onDownload={helpers.onDownload}
                        onOpenToolResponse={helpers.openToolResponse}
                        onOpenFile={helpers.openFile}
                    />
                )}
                isActive
                placeholder="Ask about this workspace..."
            />
        </InsightProvider>
    );
}
```

## Example B (simplest drop-in)

Use this when you want a full chat quickly with almost no wiring.

```tsx
import { InsightProvider } from "@semoss/sdk/react";
import { Chat } from "@semoss/chat/components";

export function MinimalChatPage() {
    return (
        <InsightProvider>
            <Chat
                options={{ engineId: "your-engine-id" }}
                isActive
                placeholder="Ask me anything..."
            />
        </InsightProvider>
    );
}
```

## Example C (custom layout with explicit ChatProvider)

Use this when you need to compose pieces manually.

```tsx
import { InsightProvider } from "@semoss/sdk/react";
import { ChatProvider, useChatContext } from "@semoss/chat";
import { Chat } from "@semoss/chat/components";

function CustomBody() {
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

export function CustomPage() {
    return (
        <InsightProvider>
            <ChatProvider options={{ engineId: "your-engine-id" }} isActive>
                <CustomBody />
            </ChatProvider>
        </InsightProvider>
    );
}
```

## Example D (imperative + SelectionChatButton + Chat.Input)

Use this when text should come from outside normal chat UI flows (page
selection, external widgets, keyboard shortcuts).

### D1: Zero-config selection to active chat

`SelectionChatButton` sends selected text via `sendToActiveChat()` when
`onSelect` is omitted.

```tsx
import { InsightProvider } from "@semoss/sdk/react";
import { Chat } from "@semoss/chat/components";

export function SelectionToChatPage() {
    return (
        <InsightProvider>
            <Chat options={{ engineId: "your-engine-id" }} isActive />
            <Chat.SelectionChatButton />
        </InsightProvider>
    );
}
```

### D2: Prefill Chat.Input from selection, then submit imperatively

This keeps a review/edit step before sending.

```tsx
import { useState } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import { sendToActiveChat } from "@semoss/chat";
import { Chat } from "@semoss/chat/components";

function ExternalComposer() {
    const [value, setValue] = useState("");

    return (
        <div className="border-t p-3">
            <Chat.SelectionChatButton
                onSelect={(text) => {
                    setValue((prev) => (prev ? `${prev}\n\n${text}` : text));
                }}
            />

            <Chat.Input
                value={value}
                onValueChange={setValue}
                onSubmit={(text) => {
                    void sendToActiveChat(text);
                    setValue("");
                }}
                placeholder="Review selected text, then send"
            />
        </div>
    );
}

export function ImperativeComposerPage() {
    return (
        <InsightProvider>
            <Chat options={{ engineId: "your-engine-id" }} isActive />
            <ExternalComposer />
        </InsightProvider>
    );
}
```

Notes:

- `sendToActiveChat()` throws if no active chat store is registered.
- Keep at least one mounted chat with `isActive` (default `true`) before
  firing imperative sends.
- Use `sendToActiveRoom(roomId, text)` when targeting a specific room.

## AI agent implementation playbook

When asked to add or change behavior:

1. Add transport call in `src/transport/pixel-calls.ts` first.
2. Add/modify store action in `src/stores/*`.
3. Expose state/actions through provider hook in `src/contexts/*`.
4. Wire UI in `src/components/*` via context hooks only.
5. Export intentionally from `src/index.ts` or `src/components/index.ts`.

Do not skip layers (for example, components importing transport directly).

## Common mistakes to avoid

- Importing `cn` from package-local utils instead of `@semoss/ui`.
- Reintroducing local `date.ts`/`clipboard.ts` wrappers in `libs/chat/src/lib`.
- Calling `@semoss/sdk` from components, contexts, or stores.
- Using `@semoss/chat/components` without required provider/theme prerequisites.

## Quick verification commands

```bash
pnpm --filter @semoss/chat test
pnpm --filter @semoss/chat type-check
pnpm --filter @semoss/chat build
```
