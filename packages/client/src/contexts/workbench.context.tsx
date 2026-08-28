import { createContext, type ReactNode, useRef } from "react";
import type { StoreApi } from "zustand";
import { createWorkbenchStore, type WorkbenchState } from "@/stores/workbench";

/** Scoped zustand store for the nearest workbench. */
export const WorkbenchStoreContext = createContext<
	StoreApi<WorkbenchState> | undefined
>(undefined);

interface WorkbenchProviderProps {
	/** Unique identity used to isolate workbench state. */
	id: string;

	/** Workbench content that consumes the scoped store. */
	children: ReactNode;
}

/** Provide one isolated workbench store. */
export function WorkbenchProvider({ id, children }: WorkbenchProviderProps) {
	const storeRef = useRef<StoreApi<WorkbenchState> | null>(null);
	if (!storeRef.current) {
		storeRef.current = createWorkbenchStore(id);
	}

	return (
		<WorkbenchStoreContext.Provider value={storeRef.current}>
			{children}
		</WorkbenchStoreContext.Provider>
	);
}
