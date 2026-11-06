import { createStore } from "zustand";
import type { AccessStore } from "../contexts/access.context";
import {
	createPermissionCache,
	type PermissionCache,
} from "../types/access.types";

/**
 * A standalone permission cache, for a host that has no session store to fold
 * it into.
 *
 * The client mirrors the SDK session's `Session.permissions` instead, so its
 * permissions are cleared on every sign in and out. A host without that — the
 * playground, or a test — gets the cache on its own.
 *
 * @return A store satisfying `PermissionCache`.
 */
export const createAccessStore = (): AccessStore =>
	createStore<PermissionCache>()((set, get) =>
		createPermissionCache(
			(update) =>
				set((state) => ({ permissions: update(state.permissions) })),
			() => get().permissions,
		),
	);
