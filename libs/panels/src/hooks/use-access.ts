import type { Role } from "@semoss/sdk";
import { useSessionPermissions } from "@semoss/sdk/react";
import type { ResourceType } from "../types/file-panel.types";

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
 * Resolve one resource's permission off the session's shared cache, so every
 * surface open on a resource sees the same answer.
 *
 * @param type - Kind of resource being accessed.
 * @param id - The resource's id. An insight without one (a user's own files)
 * is editable; a project or engine without one is an error.
 * @return Loading, error, or ready state — `permission`/`readOnly` only once resolved.
 */
export const useAccess = (type: ResourceType, id: string): AccessState => {
	const access = useSessionPermissions(type, id || null);

	if (access.status === "IDLE") {
		// a project or engine is always named; without an id there is nothing
		// the user can be shown to have access to
		if (type !== "INSIGHT") {
			return {
				status: "error",
				error: "No resource to read access for",
				refresh: access.refresh,
			};
		}
		return {
			status: "ready",
			permission: "EDIT",
			readOnly: false,
			refreshing: false,
			refresh: () => Promise.resolve("EDIT"),
		};
	}

	if (access.status === "LOADING" || !access.permission) {
		if (access.status === "ERROR") {
			return {
				status: "error",
				error: access.error ?? "Failed to load resource access",
				refresh: access.refresh,
			};
		}
		return { status: "loading" };
	}

	return {
		status: "ready",
		permission: access.permission,
		readOnly: !access.canEdit,
		refreshing: access.refreshing,
		refreshError: access.error ?? undefined,
		refresh: access.refresh,
	};
};
