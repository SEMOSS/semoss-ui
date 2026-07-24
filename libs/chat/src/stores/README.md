# `stores/`

Headless Zustand stores — the state + actions layer that everything else in
this package (contexts, components) is built on top of. No React here; these
are plain `zustand/vanilla` stores so they can be used, tested, or driven
outside of a component tree.

## Layout

Each store gets its own subfolder, named after the store:

```
stores/
├── chat/
│   ├── chat-store.ts        createChatStore() + ChatStoreState/Options/Handle
│   └── chat-store.test.ts
├── chat-rooms/
│   ├── chat-rooms-store.ts
│   └── chat-rooms-store.test.ts
└── index.ts                 barrel re-exporting every store
```

## Adding a new store

1. Create `stores/<name>/<name>-store.ts` exporting a `create<Name>Store()`
   factory plus its `<Name>StoreState`/`<Name>StoreOptions`/`<Name>StoreHandle`
   types (follow `chat-store.ts` as the template).
2. Add `stores/<name>/<name>-store.test.ts` alongside it.
3. Re-export the new store from `stores/index.ts` so consumers can import it
   via `@semoss/chat` without knowing the internal file layout.
4. If the store needs to be consumed from React, pair it with a provider in
   `../contexts/` (see `contexts/README.md`) rather than reaching into
   `stores/` directly from a component.
