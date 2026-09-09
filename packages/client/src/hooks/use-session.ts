import { useContext } from "react";
import { useStore } from "zustand";
import { SessionStoreContext } from "@/contexts";
import type { SessionStoreState } from "@/stores";

/** Select state from the application session store. */
export const useSession = <T = SessionStoreState>(
	selector: (state: SessionStoreState) => T = (state) => state as T,
): T => {
	const store = useContext(SessionStoreContext);
	if (!store) {
		throw new Error(
			"useSession must be used within a SessionStoreProvider",
		);
	}

	return useStore(store, selector);
};
