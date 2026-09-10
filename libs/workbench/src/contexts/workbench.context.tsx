import { createContext, type ReactNode, useRef } from "react";
import type { StoreApi } from "zustand";
import { createWorkbenchStore, type WorkbenchState } from "../stores";

/** Scoped zustand store for the nearest workbench. */
export const WorkbenchStoreContext = createContext<
	StoreApi<WorkbenchState> | undefined
>(undefined);

interface WorkbenchProviderProps {
	/** Unique key used to isolate persisted workbench state. */
	cacheKey: string;

	/** Workbench content that consumes the scoped store. */
	children: ReactNode;
}

/** Provide one isolated workbench store. */
export function WorkbenchProvider({
	cacheKey,
	children,
}: WorkbenchProviderProps) {
	const storeRef = useRef<{
		cacheKey: string;
		store: StoreApi<WorkbenchState>;
	} | null>(null);
	if (!storeRef.current || storeRef.current.cacheKey !== cacheKey) {
		storeRef.current = {
			cacheKey,
			store: createWorkbenchStore(cacheKey),
		};
	}

	return (
		<WorkbenchStoreContext.Provider
			key={cacheKey}
			value={storeRef.current.store}
		>
			{children}
		</WorkbenchStoreContext.Provider>
	);
}
