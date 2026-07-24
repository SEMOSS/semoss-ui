# `transport/`

Network boundary for the package — every call out to the SEMOSS backend
(via `@semoss/sdk/react`'s `runPixelAsync`/`getPixelJobStreaming`/`download`/
`uploadInsight`, etc.) is wrapped here as a plain async function. `stores/`
call these functions; they never call `@semoss/sdk` directly.

## Layout

```
transport/
├── pixel-calls.ts        AskPlayground / CreatePlaygroundRoom / RunMCPTool /
│                          room list/rename/pin/delete / upload / download /
│                          feedback pixel calls
└── pixel-calls.test.ts
```

## Conventions

- Each exported function should take plain, serializable arguments and
  return a plain value/Promise — no store or React state leaks into this
  layer.
- Mock this module (`vi.mock("../transport/pixel-calls", ...)`) in
  `stores/` tests instead of mocking `@semoss/sdk` directly, so tests don't
  need to know the SDK's call shape.
- If a new backend call is needed, add it here first, then consume it from
  the relevant `stores/<name>/<name>-store.ts`.
