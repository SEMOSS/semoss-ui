# AGENTS.md - @semoss/sdk

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Skills

These guides ship in the package's `skills/` folder (via `files` and `npmSkills.publish.source` in
[package.json](./package.json)), so apps get them under `node_modules/@semoss/sdk/skills/`. This
file is the only place in the repo that routes to them.

- [Session, config and permissions](./skills/session.skill.md): sign in and out, the user and
  their metadata, `useSession`/`useConfig`/`useSessionPermissions`/`useLogins`, and which insight
  a pixel runs in.
- [Rooms, chat and agent runs](./skills/sdk-chat/SKILL.md): rooms, AskRoom jobs,
  RunAgent/`AgentStore`, tool approvals, and streaming.

Rules for working with them:

- Keep them self-contained for outside consumers: no links to `docs/`, root `skills/`, or other
  packages.
- When an API they describe changes, update the skill in the same change. Do not keep a second
  copy of their API tables anywhere else.
- Verify signatures, exports, and defaults against [src/index.ts](./src/index.ts) and nearby tests.
- Comments and mocked tests do not prove backend behavior. Keep the guides' compatibility caveats
  until the backend is verified.
- Repo callers: a room keeps its own `InsightProvider`; sign in, the user, and permissions come
  from `Session`. Keep chat job streaming separate from agent-run polling.

## Purpose

The core client SDK for a SEMOSS backend: pixel and API calls, insight state, environment config,
and session. Framework-independent stores with optional React bindings. This is not a blanket
Node or SSR compatibility promise. The published surface is stable and versioned.

## Boundaries

- **No runtime dependencies.** `@semoss/utility` is a devDependency the build bundles into `dist`;
  public types must never reference utility types, because declarations are not bundled.
- React-only code lives under `src/js-frameworks/react`, published as `@semoss/sdk/react`.

## Invariants

- **Two kinds of store; do not convert them.** `Config`, `Session`, `Session.insight`,
  `Session.logins`, and the permission cache hold a private `StoreState` and are the reference
  for the [state standard](../../docs/standards/react.md#state). `InsightStore`, `AgentStore`,
  `RoomStore`, and `Env` hold plain private state behind getters.
- **All statuses are upper case** (`INITIALIZING`, `READY`, `ERROR`, …).
- Never edit `dist/`. Be careful with `src/index.ts`, the React entry, `env.ts`, `listener.ts`, and
  `vite.config.ts`: every package depends on them.

## When Adding to the SDK

Follow [call-backend](../../skills/call-backend.skill.md). Framework-agnostic code goes outside
`js-frameworks/`. Export from `src/index.ts` or the React entry. When a change touches chat,
agents, or MCP, inspect the owner and its tests: [api/chat.ts](./src/api/chat.ts),
[api/base.ts](./src/api/base.ts), [api/agent.ts](./src/api/agent.ts),
[api/mcp.ts](./src/api/mcp.ts), [AgentStore](./src/stores/agent/agent.store.ts),
[RoomStore](./src/stores/room/room.store.ts), [types.ts](./src/types.ts).

## Validation

```bash
pnpm --filter @semoss/sdk test
pnpm --filter @semoss/sdk build    # both entries must build
```

For documentation-only edits, check links, skill metadata, that the skills are included in the
package, and examples against exports. Do not present those checks as backend verification.
