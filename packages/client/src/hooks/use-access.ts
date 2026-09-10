import { useCallback, useEffect } from "react";
import type { Role } from "@semoss/sdk";
import type { ResourceType } from "@/stores/session";
import { getPermissionKey } from "@/stores/session";
import { useSession } from "./use-session";

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

/**
 * Resolve one resource's permission off the session's shared cache.
 *
 * The cache is session-scoped, so every workbench open on a resource sees the
 * same answer and a revalidation reaches all of them at once. Callers that
 * want to force a round trip on mount use `refresh()`; the first read of an
 * unknown resource loads it lazily.
 *
 * @name useAccess
 * @param type - Kind of resource being accessed.
 * @param id - The resource's id.
 * @return Loading, error, or ready state — `permission`/`readOnly` only once resolved.
 */
export const useAccess = (type: ResourceType, id: string): AccessState => {
	const key = getPermissionKey(type, id);
	const entry = useSession((state) => state.permissions[key]);
	const loadPermission = useSession((state) => state.loadPermission);
	const refreshPermission = useSession((state) => state.refreshPermission);

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
