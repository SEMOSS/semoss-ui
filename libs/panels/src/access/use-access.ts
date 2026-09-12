import { useCallback, useContext, useEffect } from "react";
import { useStore } from "zustand";
import type { Role } from "@semoss/sdk";
import { AccessStoreContext } from "./access.context";
import { getPermissionKey, type ResourceType } from "./permission-cache";

/** Still resolving a resource's permission for the first time. */
interface AccessLoadingState {
	status: "loading";
}

/** Permission has never resolved and there is no stale value to fall back on. */
interface AccessErrorState {
	status: "error";
	error: string;
	refresh: () => Promise<Role>;
}

/** Permission is known — either fresh, mid-refresh, or stale after a failed refresh. */
interface AccessReadyState {
	status: "ready";
	permission: Role;
	readOnly: boolean;
	/** A background refresh is in flight; last-known permission is still shown. */
	refreshing: boolean;
	/** Set when the most recent refresh failed; last-known permission is still shown. */
	refreshError?: string;
	refresh: () => Promise<Role>;
}

export type AccessState =
	| AccessLoadingState
	| AccessErrorState
	| AccessReadyState;

/** The host's permission cache, or a throw naming the missing provider. */
export const useAccessStore = () => {
	const store = useContext(AccessStoreContext);
	if (!store) {
		throw new Error(
			"File panels must be mounted underneath an AccessStoreProvider",
		);
	}
	return store;
};

/**
 * Resolve one resource's permission off the host's shared cache.
 *
 * The cache is host-scoped, so every surface open on a resource sees the same
 * answer and a revalidation reaches all of them at once.
 *
 * @param type - Kind of resource being accessed.
 * @param id - The resource's id.
 * @return Loading, error, or ready state — `permission`/`readOnly` only once resolved.
 */
export const useAccess = (type: ResourceType, id: string): AccessState => {
	const store = useAccessStore();
	const key = getPermissionKey(type, id);
	const entry = useStore(store, (state) => state.permissions[key]);
	const loadPermission = useStore(store, (state) => state.loadPermission);
	const refreshPermission = useStore(
		store,
		(state) => state.refreshPermission,
	);

	useEffect(() => {
		if (!entry) {
			void loadPermission(type, id).catch(() => undefined);
		}
	}, [loadPermission, entry, id, type]);

	const refresh = useCallback(
		() => refreshPermission(type, id),
		[refreshPermission, id, type],
	);

	if (!entry || (entry.status === "LOADING" && !entry.permission)) {
		return { status: "loading" };
	}

	if (entry.status === "ERROR" && !entry.permission) {
		return {
			status: "error",
			error: entry.error ?? "Failed to load resource access",
			refresh,
		};
	}

	// entry.permission is defined here: SUCCESS always sets it, and the two
	// branches above rule out LOADING/ERROR without a stale value.
	const permission = entry.permission as Role;
	return {
		status: "ready",
		permission,
		readOnly: !(permission === "OWNER" || permission === "EDIT"),
		refreshing: entry.status === "LOADING",
		refreshError: entry.status === "ERROR" ? entry.error : undefined,
		refresh,
	};
};
