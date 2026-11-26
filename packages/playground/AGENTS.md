# AGENTS.md - @semoss/playground

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

The SEMOSS chat application (private): rooms, messages, the room Workspace dock, knowledge, tools,
connectors, and agents.

## Boundaries

- Source-only libraries compile in the app; run `pnpm dev:playground` from the root so built
  libraries watch too.
- **No `api/` folder, and none should be added.** Shared backend calls live in `libs/sdk/src/api/`;
  asset pixels come from `@semoss/shared`'s `getFileExplorerAdapter`.
- New features go in `src/features/<feature>/`, importing anything outside their folder through
  `@/`.
- New state lives in hooks over SDK stores or a `StoreState` store, never new MobX or Zustand.
  `RoomStore`, `ChatStore`, and the message, tool, connector, and context-item stores are MobX and
  migrate one at a time. `room.workbench` stays Zustand until the dock moves.
- Never edit `.env.local` / `.env.*.local`, committed proxy targets, or credentials.

## Glossary

| Part | Name in code |
|---|---|
| Right-hand dock | **Workbench** (`RoomWorkbench`); "Workspace" in UI copy; `RoomStore` still says `sidebar` on purpose |
| Messages and composer | **conversation** (`RoomContent`); "Chat" is the mode |
| Icon rail on the dock's edge | **Workbench rail** (`RoomWorkbenchRail`) |
| Favorite, Rename, Publish, Download, Delete | **room actions** (`useRoomActionItems`) |
| A chat before its first message | **new room**; once created lazily, **prepared room** |
| The room's own folder | **Room Files** |

Ids and i18n keys tied to copy keep "workspace" (`workspace` slash group, `close-workspace`).

## Invariants

- **Sign in, the user, and config come from the SDK.** `main.tsx` calls `Session.initialize()`
  once, after embed auth. `AuthenticatedLayout` sends `UNAUTHENTICATED` to `/login` and shows Retry
  (`useSessionRetry`) on `ERROR`.
- **Only rooms are insights.** The app has no `InsightProvider` of its own. A room page mounts one
  with `options={{ insightId: room.insightId }}` and `destroyOnUnmount={false}`, since `RoomStore`
  owns it. Pixels outside a room use the session insight (`useSessionPixel`,
  `useSessionInsight().run`).
- **Never send `DeleteInsightAssets` an empty path.** It clears the whole space.

## Validation

```bash
pnpm --filter @semoss/playground test
pnpm --filter @semoss/playground type-check
pnpm --filter @semoss/playground dev   # with a backend on ENDPOINT
```
