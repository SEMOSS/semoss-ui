import {
	getUserEnginePermission,
	getUserProjectPermission,
	type Role,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

/**
 * Kinds of resource a permission can be resolved for: the SDK session's
 * `Session.permissions` vocabulary.
 */
export type ResourceType = "ENGINE" | "PROJECT" | "INSIGHT";

/**
 * One resource's cached permission, plus how the last fetch went.
 *
 * @deprecated Part of {@link PermissionCache}; the session's entries have the
 * same shape (`Session.permissions.get(type, id)`).
 */
export interface AccessEntry {
	status: "LOADING" | "SUCCESS" | "ERROR";
	permission?: Role;
	error?: string;
}

/** Stable key for one resource's permission entry. */
const getPermissionKey = (type: ResourceType, id: string): string =>
	`${type}:${id}`;

/**
 * A host-owned permission cache, which the file panels used to read through
 * `AccessStoreProvider`.
 *
 * @deprecated The file panels read the SDK session's `Session.permissions`,
 * which has the same entries and actions (`sync`, `load`, `refresh`, `clear`)
 * and is cleared on every sign in and out.
 */
export interface PermissionCache {
	/** Every resolved or in-flight resource permission, by `getPermissionKey`. */
	permissions: Record<string, AccessEntry>;
	/** Store an already-resolved permission (e.g. one a route already loaded). */
	syncPermission: (type: ResourceType, id: string, permission: Role) => void;
	/** Resolve a permission, reusing a cached or in-flight result. */
	loadPermission: (type: ResourceType, id: string) => Promise<Role>;
	/** Re-resolve a permission, ignoring any cached value. */
	refreshPermission: (type: ResourceType, id: string) => Promise<Role>;
	/** Drop every cached permission. */
	clearPermissions: () => void;
}

/**
 * Creates a resource-permission cache to fold into a host's store.
 *
 * A permission is a fact about (user, resource), so the cache outlives every
 * workbench and whoever owns it must clear it on logout — see
 * `clearPermissions`.
 *
 * @deprecated The file panels read the SDK session's `Session.permissions`,
 * which already is this cache, shared by every view and cleared on every sign
 * in and out; nothing in them reads a cache made here.
 *
 * @name createPermissionCache
 * @param setPermissions - Commit a new permissions map onto the session state.
 * @param getPermissions - Read the current permissions map.
 * @return The permission fields and actions to spread into the session store.
 */
export const createPermissionCache = (
	setPermissions: (
		update: (
			current: Record<string, AccessEntry>,
		) => Record<string, AccessEntry>,
	) => void,
	getPermissions: () => Record<string, AccessEntry>,
): PermissionCache => {
	// Keyed by resource, so N panels mounting on one resource cost one pixel.
	const inFlight = new Map<string, Promise<Role>>();

	const write = (key: string, entry: AccessEntry): void => {
		setPermissions((current) => ({ ...current, [key]: entry }));
	};

	const requestPermission = (
		type: ResourceType,
		id: string,
	): Promise<Role> => {
		if (type === "ENGINE") {
			return getUserEnginePermission(id);
		}
		if (type === "PROJECT") {
			return getUserProjectPermission(id);
		}
		return Promise.resolve("EDIT");
	};

	const fetchPermission = (
		type: ResourceType,
		id: string,
		force: boolean,
	): Promise<Role> => {
		const key = getPermissionKey(type, id);
		const current = getPermissions()[key];
		if (!force && current?.status === "SUCCESS" && current.permission) {
			return Promise.resolve(current.permission);
		}

		const pending = inFlight.get(key);
		if (pending) return pending;

		write(key, { status: "LOADING", permission: current?.permission });

		const request = requestPermission(type, id)
			.then((permission) => {
				write(key, { status: "SUCCESS", permission });
				return permission;
			})
			.catch((error: unknown) => {
				const message = getErrorMessage(error);
				write(key, {
					status: "ERROR",
					permission: current?.permission,
					error: message,
				});
				throw error;
			})
			.finally(() => inFlight.delete(key));

		inFlight.set(key, request);
		return request;
	};

	return {
		permissions: {},

		syncPermission: (type, id, permission) => {
			const key = getPermissionKey(type, id);
			const current = getPermissions()[key];
			if (
				current?.status === "SUCCESS" &&
				current.permission === permission
			) {
				return;
			}
			// One cache is shared by every workbench, so a second one mounting
			// with a stale route-supplied value must not clobber a fetch that
			// is already in the air.
			if (current?.status === "LOADING") {
				return;
			}

			write(key, { status: "SUCCESS", permission });
		},

		loadPermission: (type, id) => fetchPermission(type, id, false),
		refreshPermission: (type, id) => fetchPermission(type, id, true),

		clearPermissions: () => {
			inFlight.clear();
			setPermissions(() => ({}));
		},
	};
};
