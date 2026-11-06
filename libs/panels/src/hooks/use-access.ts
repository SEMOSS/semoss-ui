import type { Role } from "@semoss/sdk";
import { useSessionPermissions } from "@semoss/sdk/react";
import type { ResourceType } from "../types/access.types";

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
 * What an insight's permission always is. Hoisted so `refresh` keeps its
 * identity across renders, as the session's own `refresh` does.
 */
const refreshInsight = (): Promise<Role> => Promise.resolve("EDIT");

/**
 * Resolve one resource's permission off the session's shared cache.
 *
 * Reads `Session.permissions` through `useSessionPermissions`, so every
 * surface open on a resource — a panel, its chrome control, a host's own
 * workbench — sees the same answer, a revalidation reaches all of them at
 * once, and a sign in or out clears it. The panels need no provider for it.
 *
 * @param type - Kind of resource being accessed.
 * @param id - The resource's id. Empty only for a scope with no resource of
 * its own, such as a user's own files, which callers ask about as an
 * `INSIGHT`.
 * @return Loading, error, or ready state — `permission`/`readOnly` only once resolved.
 */
export const useAccess = (type: ResourceType, id: string): AccessState => {
	const { status, permission, canEdit, refreshing, error, refresh } =
		useSessionPermissions(type, id);

	// no id, so the session reads nothing: an insight is always the user's
	// to edit, as the session would answer for one with an id, and anything
	// else fails closed
	if (status === "IDLE") {
		return type === "INSIGHT"
			? {
					status: "ready",
					permission: "EDIT",
					readOnly: false,
					refreshing: false,
					refresh: refreshInsight,
				}
			: {
					status: "error",
					error: "No resource to read a permission for",
					refresh,
				};
	}

	if (status === "LOADING") {
		return { status: "loading" };
	}

	if (status === "ERROR" || !permission) {
		return {
			status: "error",
			error: error ?? "Failed to load resource access",
			refresh,
		};
	}

	// a known permission stays on screen while it is read again, and after
	// that read fails, when `error` says why
	return {
		status: "ready",
		permission,
		readOnly: !canEdit,
		refreshing,
		refreshError: error ?? undefined,
		refresh,
	};
};
