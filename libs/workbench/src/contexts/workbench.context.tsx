import { createContext, type ReactNode, useRef } from "react";
import type { StoreApi } from "zustand";
import { createWorkbenchStore, type WorkbenchState } from "../stores";
import type { WorkbenchPanelConfigAny, WorkbenchPanelType } from "../types";

/** Scoped zustand store for the nearest workbench. */
export const WorkbenchStoreContext = createContext<
	StoreApi<WorkbenchState> | undefined
>(undefined);

type WorkbenchProviderProps = {
	/** Workbench content that consumes the scoped store. */
	children: ReactNode;
} & (
	| {
			/**
			 * Panel blueprints keyed by type. Keep the map module-scope: it is
			 * read once, when the store is built, so a map that churns
			 * identity is not re-read.
			 */
			components: Record<WorkbenchPanelType, WorkbenchPanelConfigAny>;

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
			 * Such a host passes its own blueprints to `createWorkbenchStore`.
			 */
			store: StoreApi<WorkbenchState>;
			components?: never;
	  }
);

/**
 * Provide one isolated workbench store.
 *
 * The store lives for as long as this provider is mounted. A host that needs a
 * fresh dock when something about it changes — a different database, say —
 * gives the provider a React `key`, the same as any other component; there is
 * no identity prop to compare, because the dock has no identity of its own.
 */
export function WorkbenchProvider({
	components,
	store,
	children,
}: WorkbenchProviderProps) {
	const storeRef = useRef<StoreApi<WorkbenchState> | null>(null);
	if (!store && components && !storeRef.current) {
		storeRef.current = createWorkbenchStore({ components });
	}

	const value = store ?? storeRef.current;
	if (!value) {
		throw new Error(
			"WorkbenchProvider needs either a store or a components map",
		);
	}

	return (
		<WorkbenchStoreContext.Provider value={value}>
			{children}
		</WorkbenchStoreContext.Provider>
	);
}
