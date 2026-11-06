import { createStore, type StoreApi } from "zustand";
import type { PermissionCache } from "@semoss/panels";
import { Session, type SessionPermissionStore } from "@semoss/sdk";

/**
 * The file panels' permission cache, read from the session's own.
 *
 * `@semoss/panels` reads permissions through `AccessStoreProvider`, while the
 * client's workbenches and pages use the SDK session's `Session.permissions`.
 * This mirrors one into the other, so a panel and a workbench open on the same
 * resource always agree, and a sign in or out clears both.
 *
 * A stopgap: once `@semoss/panels` reads the session's permissions itself,
 * through `useSessionPermissions`, delete this and the client's
 * `AccessStoreProvider`.
 *
 * @param permissions - The session's permission store. Defaults to the page's.
 * @returns A store satisfying the panels' `PermissionCache`.
 */
export const createSessionAccessStore = (
	permissions: SessionPermissionStore = Session.permissions,
): StoreApi<PermissionCache> => {
	const store = createStore<PermissionCache>()(() => ({
		permissions: permissions.getSnapshot(),
		syncPermission: permissions.sync,
		loadPermission: permissions.load,
		refreshPermission: permissions.refresh,
		clearPermissions: permissions.clear,
	}));

	// the page's session lives as long as the page, so this is never undone
	permissions.subscribe(() => {
		store.setState({ permissions: permissions.getSnapshot() });
	});

	return store;
};
