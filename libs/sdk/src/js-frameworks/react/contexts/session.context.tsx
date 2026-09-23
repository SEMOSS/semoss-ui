import { createContext, type ReactNode, useRef } from "react";
import { createSessionStore, type SessionStore } from "../../../stores/session";
import { AccessProvider } from "./access.context";

export const SessionStoreContext = createContext<SessionStore | undefined>(
	undefined,
);

interface SessionProviderProps {
	/** Application content that consumes the scoped session. */
	children: ReactNode;
	/** Optional externally-created store, primarily for host setup and tests. */
	store?: SessionStore;
}

/** Provide one stable session and its access cache to a React subtree. */
export function SessionProvider({ children, store }: SessionProviderProps) {
	const storeRef = useRef<SessionStore | null>(null);
	if (storeRef.current === null) {
		storeRef.current = store ?? createSessionStore();
	}

	return (
		<SessionStoreContext.Provider value={storeRef.current}>
			<AccessProvider store={storeRef.current}>{children}</AccessProvider>
		</SessionStoreContext.Provider>
	);
}
