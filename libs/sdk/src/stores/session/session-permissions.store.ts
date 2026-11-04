import { getErrorMessage } from "@semoss/utility/error";
import { Observable } from "@semoss/utility/observable";
import {
	getUserEnginePermission,
	getUserProjectPermission,
} from "../../api/permissions";
import type { Role } from "../../types";

/**
 * How each kind of resource's permission is read. Its keys are the kinds of
 * resource the store accepts. An insight is always editable by the user who
 * opened it, so it is never read.
 */
const PERMISSION_READERS = {
	ENGINE: (id: string) => getUserEnginePermission(id),
	PROJECT: (id: string) => getUserProjectPermission(id),
	INSIGHT: async (_id: string): Promise<Role> => "EDIT",
};

/**
 * The key one resource's permission is kept under in the store's snapshot.
 *
 * @param type - The kind of resource.
 * @param id - The resource's id.
 * @returns The key, such as `PROJECT:1234`.
 */
export const getPermissionKey = (
	type: keyof typeof PERMISSION_READERS,
	id: string,
): string => `${type}:${id}`;

/**
 * Whether a permission lets the user change the resource.
 *
 * @param role - The permission, or nothing when not known.
 * @returns True for an owner or editor.
 */
export const isEditRole = (role: Role | null | undefined): boolean =>
	role === "OWNER" || role === "EDIT";

/**
 * Whether a permission makes the user the resource's owner.
 *
 * @param role - The permission, or nothing when not known.
 * @returns True for an owner.
 */
export const isOwnerRole = (role: Role | null | undefined): boolean =>
	role === "OWNER";

/**
 * No permissions known, and the shape of every snapshot: each resource's
 * entry, keyed by {@link getPermissionKey}.
 */
const NO_PERMISSIONS: Record<
	string,
	{
		/** Whether the last read is running, finished, or failed. */
		status: "LOADING" | "SUCCESS" | "ERROR";
		/** The last known permission, kept while a new read runs or after it fails. */
		permission?: Role;
		/** Why the last read failed. */
		error?: string;
	}
> = {};

/**
 * The signed in user's permission on each resource the page has asked about,
 * keyed by {@link getPermissionKey}.
 *
 * A permission is a fact about the user and the resource, not about a view,
 * so every view on the same resource shares one read and always agrees: two
 * panels open on one project never disagree about whether it is editable. The
 * store therefore outlives every view, and its session clears it whenever the
 * user changes, so one user's permissions never show up for the next.
 *
 * @example
 * ```ts
 * const role = await Session.permissions.load("PROJECT", projectId);
 * if (isEditRole(role)) {
 *     // show the editor
 * }
 * ```
 */
export class SessionPermissionStore {
	/**
	 * Every resource's permission, starting with none known. Held privately so the
	 * store's public types do not depend on how it is kept.
	 */
	private readonly state = new Observable(NO_PERMISSIONS);

	/**
	 * Read the current state. The same object until it changes, as
	 * `useSyncExternalStore` requires.
	 *
	 * @returns The current state.
	 */
	getSnapshot = (): typeof NO_PERMISSIONS => this.state.getSnapshot();

	/**
	 * Hear about every change to the state.
	 *
	 * @param listener - Called after each change; read the new state with
	 * `getSnapshot`.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The read in flight for each resource, so many views cost one read. */
	private readonly inFlight = new Map<string, Promise<Role>>();

	/**
	 * Counts users: every clear adds one, and a read that lands after the count
	 * has moved on belongs to the previous user, so it is dropped.
	 */
	private version = 0;

	/**
	 * Look up what is known about a resource's permission, without reading it.
	 *
	 * @param type - The kind of resource.
	 * @param id - The resource's id.
	 * @returns The entry, or null when it has not been asked for.
	 */
	get = (
		type: keyof typeof PERMISSION_READERS,
		id: string,
	): (typeof NO_PERMISSIONS)[string] | null =>
		this.getSnapshot()[getPermissionKey(type, id)] ?? null;

	/**
	 * Read a resource's permission, reusing a known one or joining a read in
	 * flight.
	 *
	 * @param type - The kind of resource.
	 * @param id - The resource's id.
	 * @returns The permission.
	 * @throws When the backend cannot say, such as when the user has no access.
	 */
	load = (type: keyof typeof PERMISSION_READERS, id: string): Promise<Role> =>
		this.read(type, id, false);

	/**
	 * Read a resource's permission again, ignoring a known one, as after the
	 * user's access changed. A failed read keeps the last known permission.
	 *
	 * @param type - The kind of resource.
	 * @param id - The resource's id.
	 * @returns The permission.
	 * @throws When the backend cannot say.
	 */
	refresh = (
		type: keyof typeof PERMISSION_READERS,
		id: string,
	): Promise<Role> => this.read(type, id, true);

	/**
	 * Keep a permission already read elsewhere, such as by a route, so views
	 * need not read it again.
	 *
	 * @param type - The kind of resource.
	 * @param id - The resource's id.
	 * @param permission - The permission that was read.
	 */
	sync = (
		type: keyof typeof PERMISSION_READERS,
		id: string,
		permission: Role,
	): void => {
		const key = getPermissionKey(type, id);
		const current = this.getSnapshot()[key];

		// a read in flight is newer than a value a route read earlier
		if (current?.status === "LOADING") {
			return;
		}

		// nothing changes, so listeners are not told
		if (
			current?.status === "SUCCESS" &&
			current.permission === permission
		) {
			return;
		}

		this.write(key, { status: "SUCCESS", permission: permission });
	};

	/**
	 * Forget every permission, as when the user signs out. Reads in flight are
	 * dropped: they change nothing when they land.
	 */
	clear = (): void => {
		this.version++;
		this.inFlight.clear();
		this.state.set(NO_PERMISSIONS);
	};

	/**
	 * Read a resource's permission, sharing one read per resource.
	 *
	 * @param type - The kind of resource.
	 * @param id - The resource's id.
	 * @param force - Read again even when the permission is known.
	 * @returns The permission.
	 * @throws When the backend cannot say.
	 */
	private read = (
		type: keyof typeof PERMISSION_READERS,
		id: string,
		force: boolean,
	): Promise<Role> => {
		const key = getPermissionKey(type, id);
		const current = this.getSnapshot()[key];

		// reuse a known permission unless asked to read again
		if (!force && current?.status === "SUCCESS" && current.permission) {
			return Promise.resolve(current.permission);
		}

		// many views mounting on one resource share a single read
		const pending = this.inFlight.get(key);
		if (pending) {
			return pending;
		}

		// the user this read belongs to; a clear before it lands moves this on
		const version = this.version;

		// keep the last known permission on screen while reading again
		this.write(key, { status: "LOADING", permission: current?.permission });

		const request = PERMISSION_READERS[type](id)
			.then((permission) => {
				if (version === this.version) {
					this.write(key, {
						status: "SUCCESS",
						permission: permission,
					});
				}
				return permission;
			})
			.catch((error: unknown) => {
				if (version === this.version) {
					// a failed read keeps the last known permission
					this.write(key, {
						status: "ERROR",
						permission: current?.permission,
						error: getErrorMessage(error),
					});
				}
				throw error;
			})
			.finally(() => {
				// a clear may have dropped this read already; only remove our own
				if (this.inFlight.get(key) === request) {
					this.inFlight.delete(key);
				}
			});

		this.inFlight.set(key, request);
		return request;
	};

	/**
	 * Replace one resource's entry, keeping the others.
	 *
	 * @param key - The resource's key, from {@link getPermissionKey}.
	 * @param entry - The new entry.
	 */
	private write = (
		key: string,
		entry: (typeof NO_PERMISSIONS)[string],
	): void => {
		this.state.set({ ...this.getSnapshot(), [key]: entry });
	};
}
