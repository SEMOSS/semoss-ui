import { createStore } from "zustand";
import type { AccessStore } from "../contexts/access.context";
import {
	createPermissionCache,
	type PermissionCache,
} from "../types/access.types";

/**
 * A standalone permission cache in a store of its own.
 *
 * @deprecated The file panels read the SDK session's `Session.permissions`,
 * which a sign in or out clears, so nothing in them reads a store made here.
 * Read permissions with `useSessionPermissions` from `@semoss/sdk/react`.
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
