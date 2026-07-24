# AGENTS.md — @semoss/chat

Context for AI coding assistants (and humans) picking up this package cold.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for monorepo
> conventions, commit messages, Biome config, and Node/pnpm requirements.

## What this is

`@semoss/chat` is a headless chat domain layer (`@semoss/chat`) plus a
styled component library built on top of it (`@semoss/chat/components`).
See [`README.md`](./README.md) for the full usage guide and
[`src/stores/README.md`](./src/stores/README.md) /
[`src/contexts/README.md`](./src/contexts/README.md) /
[`src/components/README.md`](./src/components/README.md) for the
conventions of each layer.

## Where things live

```
src/
├── components/   styled React components  (@semoss/chat/components entry)
├── contexts/     Provider + use*Context()/use*Store() hooks per store
├── stores/       headless zustand/vanilla stores, one subfolder per store
├── transport/    the only files allowed to call @semoss/sdk
└── lib/          pure, framework-agnostic utilities
```

Data flows one direction only: `transport/` → `stores/` → `contexts/` →
`components/`. Never skip a layer (e.g. a component must not import a
store directly — it goes through the context's hook).

## Template: adding a new piece, end to end

When you add a new store-backed feature, follow this shape — one base
props interface that every related component extends, a clear section
banner per exported piece, and a full worked example at the bottom so the
next person (or agent) can copy-paste it and see it running immediately.
This mirrors `chat-store.ts` → `chat-provider.tsx` → `message-list.tsx`,
just condensed into one illustrative file below.

```tsx
"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import { type StoreApi, useStore } from "zustand";
import { createStore } from "zustand/vanilla";

/**
 * Shared props every widget backed by this store accepts. Keep this
 * loose and let each widget narrow further — mirrors `BaseFieldProps` in
 * a react-hook-form field library: one small contract, many components
 * extend it via `interface XProps extends BaseWidgetProps { ... }`.
 */
interface BaseWidgetProps {
	className?: string;
}

/* -------------------------------------------------------------------------- */
/* 1. Store — src/stores/<name>/<name>-store.ts                               */
/* -------------------------------------------------------------------------- */

export interface WidgetStoreState {
	count: number;
	increment: () => void;
}

export function createWidgetStore(): StoreApi<WidgetStoreState> {
	return createStore<WidgetStoreState>((set) => ({
		count: 0,
		increment: () => set((s) => ({ count: s.count + 1 })),
	}));
}

/* -------------------------------------------------------------------------- */
/* 2. Context — src/contexts/widget-provider.tsx                              */
/* -------------------------------------------------------------------------- */

const WidgetStoreContext = createContext<StoreApi<WidgetStoreState> | null>(
	null,
);

export interface WidgetProviderProps {
	children: React.ReactNode;
}

export function WidgetProvider({ children }: WidgetProviderProps) {
	const storeRef = useRef<StoreApi<WidgetStoreState>>();
	if (!storeRef.current) {
		storeRef.current = createWidgetStore();
	}

	return (
		<WidgetStoreContext.Provider value={storeRef.current}>
			{children}
		</WidgetStoreContext.Provider>
	);
}

function useWidgetStoreApi(): StoreApi<WidgetStoreState> {
	const store = useContext(WidgetStoreContext);
	if (!store) {
		throw new Error("useWidgetContext must be used within a WidgetProvider");
	}
	return store;
}

export function useWidgetContext(): WidgetStoreState;
export function useWidgetContext<T>(selector: (state: WidgetStoreState) => T): T;
export function useWidgetContext<T>(
	selector?: (state: WidgetStoreState) => T,
) {
	const store = useWidgetStoreApi();
	// biome-ignore lint/style/noNonNullAssertion: identity selector when omitted
	return useStore(store, selector ?? ((s) => s as unknown as T)!);
}

export function useWidgetStore(): StoreApi<WidgetStoreState> {
	return useWidgetStoreApi();
}

/* -------------------------------------------------------------------------- */
/* 3. Component — src/components/widget-counter.tsx                          */
/* -------------------------------------------------------------------------- */

interface WidgetCounterProps extends BaseWidgetProps {
	label?: string;
}

export function WidgetCounter({ className, label = "Count" }: WidgetCounterProps) {
	const { count, increment } = useWidgetContext();

	return (
		<button type="button" className={className} onClick={increment}>
			{label}: {count}
		</button>
	);
}

/* -------------------------------------------------------------------------- */
/* Example usage — how a consumer wires all three layers together             */
/* -------------------------------------------------------------------------- */

export function ExampleWidgetPage() {
	return (
		<WidgetProvider>
			<WidgetCounter label="Clicks" className="rounded-md border px-3 py-1.5" />
		</WidgetProvider>
	);
}
```

Checklist when you add a real feature this way:

1. `stores/<name>/<name>-store.ts` (+ `.test.ts`) — pure Zustand, no React.
   Update `stores/index.ts`.
2. `contexts/<name>-provider.tsx` (+ `.test.tsx`) — `Provider` +
   `use<Name>Context()` + `use<Name>Store()`. Update `contexts/index.ts`.
3. `components/<name>.tsx` (+ `.test.tsx`) — consumes the context hook only.
   Update `components/index.ts`.
4. If the store needs a backend call, add it to `transport/pixel-calls.ts`
   first and have the store call that, not `@semoss/sdk` directly.
5. Document the new public export in the top-level [`README.md`](./README.md).

## Testing & type-checking

```bash
pnpm --filter @semoss/chat test        # Vitest
pnpm --filter @semoss/chat check-types # tsc --noEmit
pnpm --filter @semoss/chat build       # Rollup — both entry points
```

Run these before considering any change to this package done — see the
root `AGENTS.md`/`CLAUDE.md` for the monorepo-wide `pnpm check`/`pnpm fix`
Biome pass, which also applies here.
