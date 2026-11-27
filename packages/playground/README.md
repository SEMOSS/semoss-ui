# @semoss/playground

The SEMOSS chat's web app: the shell (routing, navigation, agents, knowledge) around
[`@semoss/chat`](../../libs/chat/README.md).

## Getting started

1. Run `pnpm install` in the repository root.
2. Run `pnpm dev:playground` there. It starts the dev server on http://localhost:5174 with the
   libraries it depends on.

The dev server proxies to a SEMOSS backend at `http://localhost:9090/Monolith`. To use another,
create `packages/playground/.env.local` (gitignored) instead of editing `.env`:

```bash
# path to the server
ENDPOINT=http://localhost:9090

# name of the deployed instance
MODULE=/Monolith
```

## Tests

Tests use Vitest with jsdom, declared directly and kept aligned with chat and the desktop app.

Tests sit next to the file they cover, named `*.test.ts` or `*.test.tsx`. From
`packages/playground`:

```bash
pnpm test
```

```bash
pnpm type-check
```

## Changing the app

[AGENTS.md](./AGENTS.md) says where each kind of change goes. Anything inside a room, a new chat,
the room list or the settings dialog is in `@semoss/chat`, not here.
