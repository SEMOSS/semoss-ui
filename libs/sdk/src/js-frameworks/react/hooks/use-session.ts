import { useContext } from "react";
import { useStore } from "zustand/react";
import type {
	SessionState,
	SessionStore,
} from "../../../stores/session/session.types";
import { SessionStoreContext } from "../contexts/session.context";

/** Return the nearest scoped session store API. */
export const useSessionStore = (): SessionStore => {
	const store = useContext(SessionStoreContext);
	if (!store) {
		throw new Error(
			"useSessionStore must be used within a SessionProvider",
		);
	}
	return store;
};

/** Select state from the nearest scoped session store. */
export const useSession = <Selected>(
	selector: (state: SessionState) => Selected,
): Selected => useStore(useSessionStore(), selector);
