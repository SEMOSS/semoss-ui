import { createContext, type ReactNode, useRef } from "react";
import type { StoreApi } from "zustand";
import {
	createWorkbenchStore,
	type WorkbenchSlice,
	type WorkbenchState,
} from "@/stores/workbench";

/** Scoped zustand store for the nearest workbench. */
export const WorkbenchStoreContext = createContext<
	StoreApi<WorkbenchState> | undefined
>(undefined);

export interface WorkbenchProviderProps<
	TExtra extends object = Record<string, never>,
> {
	/** Unique identity used to isolate workbench state. */
	id: string;

	/** Optional namespaced domain slice merged into this workbench's store (e.g. `{ database }`). */
	createDomainSlice?: WorkbenchSlice<TExtra, WorkbenchState & TExtra>;

	/** Workbench content that consumes the scoped store. */
	children: ReactNode;
}

/** Provide one isolated workbench store, optionally extended with a domain-specific slice. */
export function WorkbenchProvider<
	TExtra extends object = Record<string, never>,
>({ id, createDomainSlice, children }: WorkbenchProviderProps<TExtra>) {
	const storeRef = useRef<StoreApi<WorkbenchState & TExtra> | null>(null);
	if (!storeRef.current) {
		storeRef.current = createWorkbenchStore(id, createDomainSlice);
	}

	return (
		<WorkbenchStoreContext.Provider value={storeRef.current}>
			{children}
		</WorkbenchStoreContext.Provider>
	);
}
