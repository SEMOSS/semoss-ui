import { useEffect, useSyncExternalStore } from "react";
import type {
	LoginsSnapshot,
	LoginsStore,
} from "../../../stores/logins/logins.store";
import { useSessionStore } from "./use-session";

/**
 * What the view's session is signed in to, kept current: the logins are read
 * again when a view using this mounts and whenever the window regains focus,
 * so a sign in or out in another tab or popup shows up. Every view on the
 * page shares one read, reused for a short while.
 *
 * @returns The logins, with the actions that change them.
 */
export const useLogins = (): LoginsSnapshot & {
	/** Read the logins again; see {@link LoginsStore.refresh}. */
	refresh: LoginsStore["refresh"];
	/** Sign in to one more provider, from a click; see {@link LoginsStore.connect}. */
	connect: LoginsStore["connect"];
	/** Sign out of one provider; see {@link LoginsStore.disconnect}. */
	disconnect: LoginsStore["disconnect"];
} => {
	// the session's own logins: `Session.logins` unless a provider gives another session
	const { logins } = useSessionStore();

	const snapshot = useSyncExternalStore(
		logins.subscribe,
		logins.getSnapshot,
		logins.getSnapshot,
	);

	useEffect(() => {
		const refresh = () => {
			void logins.refresh().catch(() => undefined);
		};
		refresh();
		window.addEventListener("focus", refresh);
		return () => window.removeEventListener("focus", refresh);
	}, [logins]);

	return {
		...snapshot,
		refresh: logins.refresh,
		connect: logins.connect,
		disconnect: logins.disconnect,
	};
};
