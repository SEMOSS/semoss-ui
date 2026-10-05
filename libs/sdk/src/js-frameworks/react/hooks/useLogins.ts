import { useEffect, useSyncExternalStore } from "react";
import { Logins, type LoginsSnapshot } from "../../..";

/**
 * What the session is signed in to, kept current: the logins are read again
 * when a view using this mounts and whenever the window regains focus, so a
 * sign in or out in another tab or popup shows up. Every view on the page
 * shares one read, reused for a short while.
 *
 * @returns The logins, with the actions that change them.
 */
export const useLogins = (): LoginsSnapshot & {
	/** Read the logins again; see {@link Logins.refresh}. */
	refresh: typeof Logins.refresh;
	/** Sign in to one more provider, from a click; see {@link Logins.connect}. */
	connect: typeof Logins.connect;
	/** Sign out of one provider; see {@link Logins.disconnect}. */
	disconnect: typeof Logins.disconnect;
} => {
	const snapshot = useSyncExternalStore(
		Logins.subscribe,
		Logins.getSnapshot,
		Logins.getSnapshot,
	);

	useEffect(() => {
		const refresh = () => {
			void Logins.refresh().catch(() => undefined);
		};
		refresh();
		window.addEventListener("focus", refresh);
		return () => window.removeEventListener("focus", refresh);
	}, []);

	return {
		...snapshot,
		refresh: Logins.refresh,
		connect: Logins.connect,
		disconnect: Logins.disconnect,
	};
};
