import { useContext } from "react";
import { useStore } from "zustand";
import { RootContext } from "@/contexts";
import type { RootState, RootStore } from "@/stores";

/**
 * Access the root store. Returns `{ root }` where `root` is the Zustand StoreApi.
 * Use `useStore(root, selector)` or `useRootState(selector)` for reactive state.
 * Call `root.getState().action()` for non-reactive action calls.
 */
export const useRoot = (): { root: RootStore } => {
	const store = useContext(RootContext);
	if (!store) {
		throw new Error("useRoot must be used within a RootContext.Provider");
	}
	return { root: store };
};

/**
 * Subscribe to a slice of the root store state.
 */
export const useRootState = <T>(selector: (s: RootState) => T): T => {
	const store = useContext(RootContext);
	if (!store) {
		throw new Error(
			"useRootState must be used within a RootContext.Provider",
		);
	}
	return useStore(store, selector);
};
