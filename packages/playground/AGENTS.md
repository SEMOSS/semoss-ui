# AGENTS.md - @semoss/playground

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

The SEMOSS chat's web app (private): the shell around [`@semoss/chat`](../../libs/chat/AGENTS.md).
It owns routing, the global navigation, the theme, agents, knowledge, embedded pages, and the tour.
The desktop app ([`@semoss/playground-desktop`](../playground-desktop/AGENTS.md)) composes the same
library.

## Boundaries

- **If the desktop app needs it too, it belongs in `@semoss/chat`.** Anything inside a room, a new
  chat, the room history, or the settings dialog is the library's
  ([where a change goes](../../libs/chat/AGENTS.md#where-a-change-goes)); this app only places
  those pieces.
- What the chat is given (routes, env defaults, the platform URL, what the theme turns on) is built
  in one place, `useHostChatConfig` (`src/features/chat-config/`). A theme flag the chat needs maps
  to a `ChatOptions` field in `playgroundThemeChatOptions` (`@semoss/shared`), never a theme read
  in the chat.
- Source-only libraries compile in the app; run `pnpm dev:playground` from the root so built
  libraries watch too.
- **No `api/` folder, and none should be added.** Shared backend calls live in `libs/sdk/src/api/`;
  asset pixels come from `@semoss/shared`'s `getFileExplorerAdapter`.
- New features go in `src/features/<feature>/`, importing anything outside their folder through
  `@/`, and the chat through `@semoss/chat`. `src/pages/` holds the router, the layouts, and thin
  route pages.
- The app has no stores of its own; new shared state is a `StoreState` store.
- `.env` is also the desktop app's build env (its renderer's `envDir`): `VITE_NAME`, `VITE_THEME`,
  and the new-chat defaults apply to both. `VITE_DEFAUlT_MODEL_*` keeps its lowercase `l`, since
  deployed env files use it.
- Never edit `.env.local` / `.env.*.local`, committed proxy targets, or credentials.

## Invariants

- **Sign in, the user, and config come from the SDK.** `main.tsx` calls `Session.initialize()`
  once, after embed auth. `AuthenticatedLayout` sends `UNAUTHENTICATED` to `/login` and shows Retry
  (`useSessionRetry`) on `ERROR`.
- **Only rooms are insights.** The app has no `InsightProvider` of its own; the chat's `RoomScope`
  mounts one per room. Pixels outside a room use the session insight (`useSessionPixel`,
  `useSessionInsight().run`).

## Validation

```bash
pnpm --filter @semoss/playground test
pnpm --filter @semoss/playground type-check
pnpm --filter @semoss/playground dev   # with a backend on ENDPOINT
```
