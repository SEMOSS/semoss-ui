import { useCallback, useEffect } from "react";
import {
	getPermissionKey,
	isEditRole,
	isOwnerRole,
	type SessionPermissionStore,
} from "../../../stores/session/session-permissions.store";
import type { Role } from "../../../types";
import { useStoreSelector } from "../utility/store-selector";
import { useSessionStore } from "./use-session";

/**
 * Read the signed in user's permission on one resource, when the view mounts,
 * whenever the resource changes, and again after a sign in or out clears it.
 * Every view on the same resource shares one read. `refresh` and `sync` keep
 * their identity until the resource changes, so effects may depend on them.
 *
 * @param type - The kind of resource.
 * @param id - The resource's id. Nothing is read without one.
 * @returns The permission, how its read went, and a way to read it again.
 *
 * @example
 * ```tsx
 * const { status, canEdit } = useSessionPermissions("PROJECT", projectId);
 * if (status === "loading") {
 *     return <Spinner />;
 * }
 * return <Editor readOnly={!canEdit} />;
 * ```
 */
export const useSessionPermissions = (
	type: Parameters<SessionPermissionStore["load"]>[0],
	id: string | null | undefined,
): {
	/**
	 * `idle` without an id, `loading` until a permission is known, `ready`
	 * once one is, and `error` when none could be read.
	 */
	status: "idle" | "loading" | "ready" | "error";
	/** The permission, or null until known. */
	permission: Role | null;
	/** Whether the user may change the resource. */
	canEdit: boolean;
	/** Whether the user owns the resource. */
	isOwner: boolean;
	/** Whether a known permission is being read again. */
	refreshing: boolean;
	/** Why the last read failed, or null. */
	error: string | null;
	/** Read the permission again, as after the user's access changed. */
	refresh: () => Promise<Role>;
	/**
	 * Keep a permission already read elsewhere, such as by a route, so no view
	 * reads it again. A read in flight is not overwritten.
	 */
	sync: (permission: Role) => void;
} => {
	const { permissions } = useSessionStore();

	// only this resource's entry, so other resources' reads do not render it
	const entry = useStoreSelector(permissions, (snapshot) =>
		id ? snapshot[getPermissionKey(type, id)] : undefined,
	);

	// read again whenever the entry is gone, as after a sign in or out clears
	// every permission while this view stays on screen
	const isMissing = entry === undefined;
	useEffect(() => {
		if (id && isMissing) {
			// a failed read shows through the entry
			void permissions.load(type, id).catch(() => undefined);
		}
	}, [permissions, type, id, isMissing]);

	// kept stable across renders, since callers run them from their own effects
	const refresh = useCallback(
		() =>
			id
				? permissions.refresh(type, id)
				: Promise.reject(
						new Error("No resource to read a permission for"),
					),
		[permissions, type, id],
	);
	const sync = useCallback(
		(next: Role) => {
			if (id) {
				permissions.sync(type, id, next);
			}
		},
		[permissions, type, id],
	);

	// a known permission stays on screen while it is read again or after a failure
	const permission = entry?.permission ?? null;
	let status: "idle" | "loading" | "ready" | "error" = "loading";
	if (!id) {
		status = "idle";
	} else if (permission) {
		status = "ready";
	} else if (entry?.status === "ERROR") {
		status = "error";
	}

	return {
		status: status,
		permission: permission,
		canEdit: isEditRole(permission),
		isOwner: isOwnerRole(permission),
		refreshing: entry?.status === "LOADING" && permission !== null,
		error: entry?.error ?? null,
		refresh: refresh,
		sync: sync,
	};
};
