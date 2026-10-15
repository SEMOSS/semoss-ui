import { useContext } from "react";
import { useStore } from "zustand";
import { ConfigStoreContext } from "@/contexts";
import type { ConfigStoreState } from "@/stores";

/** Select state from the application config store. */
export const useConfig = <T = ConfigStoreState>(
	selector: (state: ConfigStoreState) => T = (state) => state as T,
): T => {
	const store = useContext(ConfigStoreContext);
	if (!store) {
		throw new Error("useConfig must be used within a ConfigStoreProvider");
	}

	return useStore(store, selector);
};
