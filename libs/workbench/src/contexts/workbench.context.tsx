import { createContext, type ReactNode, useRef } from "react";
import type { StoreApi } from "zustand";
import { createWorkbenchStore, type WorkbenchState } from "../stores";

/** Scoped zustand store for the nearest workbench. */
export const WorkbenchStoreContext = createContext<
	StoreApi<WorkbenchState> | undefined
>(undefined);

type WorkbenchProviderProps = {
	/** Workbench content that consumes the scoped store. */
	children: ReactNode;
} & (
	| {
			/** Unique key used to isolate persisted workbench state. */
			cacheKey: string;
			store?: never;
	  }
	| {
			/**
			 * A store the host made itself, with `createWorkbenchStore`.
			 *
			 * Take this branch when the dock has to outlive its shell: a host
			 * that unmounts `<Workbench>` (the playground closes its sidebar)
			 * or that drives the dock from outside React (a MobX store opening
			 * a panel) owns the store, and the provider only hands it down.
			 */
			store: StoreApi<WorkbenchState>;
			cacheKey?: never;
	  }
);

/** Provide one isolated workbench store. */
export function WorkbenchProvider({
	cacheKey,
	store,
	children,
}: WorkbenchProviderProps) {
	const storeRef = useRef<{
		cacheKey: string;
		store: StoreApi<WorkbenchState>;
	} | null>(null);
	if (!store && cacheKey !== undefined) {
		if (!storeRef.current || storeRef.current.cacheKey !== cacheKey) {
			storeRef.current = {
				cacheKey,
				store: createWorkbenchStore(cacheKey),
			};
		}
	}

	const value = store ?? storeRef.current?.store;
	if (!value) {
		throw new Error("WorkbenchProvider needs either a cacheKey or a store");
	}

	return (
		<WorkbenchStoreContext.Provider key={cacheKey} value={value}>
			{children}
		</WorkbenchStoreContext.Provider>
	);
}
