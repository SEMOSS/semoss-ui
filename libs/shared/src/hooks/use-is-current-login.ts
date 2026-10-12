import { useCallback, useSyncExternalStore } from "react";
import { Logins } from "@semoss/sdk";

/**
 * Tells whether a person is the signed in user: one of the logins the session
 * holds, with the same login type and id. It reads the SDK's logins as they
 * are, without reading them again, so every row of a long list can use it.
 *
 * @returns A check taking a person's login type, such as NATIVE, and id.
 */
export const useIsCurrentLogin = (): ((
	type: string,
	id: string,
) => boolean) => {
	const { accountIds } = useSyncExternalStore(
		Logins.subscribe,
		Logins.getSnapshot,
		Logins.getSnapshot,
	);
	return useCallback(
		(type: string, id: string) =>
			Boolean(type) &&
			Boolean(id) &&
			accountIds[type.toUpperCase()] === id,
		[accountIds],
	);
};
