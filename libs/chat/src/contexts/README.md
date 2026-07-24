# `contexts/`

React `createContext`/Provider pairs that expose a `stores/` store to a
component tree, plus the `use*` hooks used to read from it. This is the only
place in the package that should call `React.createContext` — components
should always consume state through the hook exported here, never by
importing a store directly.

## Layout

```
contexts/
├── chat-provider.tsx            ChatProvider, useChatContext, useChatStore
├── chat-provider.test.tsx
├── chat-rooms-provider.tsx      ChatRoomsProvider, useChatRoomsContext, useChatRoomsStore
├── chat-rooms-provider.test.tsx
├── file-drag-context.tsx        FileDragProvider, useFileDrag
└── index.ts                     barrel re-exporting every provider/hook
```

## Conventions

- One file per context: `<name>-provider.tsx` (or `<name>-context.tsx` for
  contexts that don't wrap a `stores/` store, like `file-drag-context.tsx`).
- Each file exports three things: the `<Name>Provider` component, a
  `use<Name>Context()` selector hook (supports an optional selector argument
  so consumers can subscribe to a slice of state), and — for store-backed
  contexts — a `use<Name>Store()` hook that returns the raw `StoreApi` for
  imperative access (`store.getState()`, `store.subscribe()`).
- Re-export new providers/hooks from `contexts/index.ts`.

## Adding a new context

1. Create `contexts/<name>-provider.tsx` following `chat-provider.tsx` as the
   template — it wires a `stores/<name>` store into `createContext` +
   `useStore`.
2. Add `contexts/<name>-provider.test.tsx`.
3. Re-export from `contexts/index.ts`.
