import { createStore } from "zustand";
import type { AccessStore } from "./access.context";
import {
	createPermissionCache,
	type PermissionCache,
} from "./permission-cache";

/**
 * A standalone permission cache, for a host that has no session store to fold
 * it into.
 *
 * The client wires `createPermissionCache` into its session store instead, so
 * permissions live beside the user they belong to and are cleared on logout. A
 * host without that — the playground, or a test — gets the cache on its own.
 *
 * @return A store satisfying `PermissionCache`.
 */
export const createAccessStore = (): AccessStore =>
	createStore<PermissionCache>()((set, get) => ({
		...createPermissionCache(
			(update) =>
				set((state) => ({ permissions: update(state.permissions) })),
			() => get().permissions,
		),
	}));
