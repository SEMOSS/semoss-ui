import {
	getUserEnginePermission,
	getUserProjectPermission,
	type Role,
} from "@semoss/sdk";
import type { WorkbenchSlice } from "../workbench.types";

export type WorkbenchAccessType = "ENGINE" | "PROJECT" | "INSIGHT";
type WorkbenchAccessStatus = "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";

interface WorkbenchAccessEntry {
	status: Exclude<WorkbenchAccessStatus, "INITIAL">;
	permission?: Role;
	error?: string;
}

interface WorkbenchAccessActions {
	/** Store an already-resolved permission for one resource. */
	syncPermission: (
		type: WorkbenchAccessType,
		id: string,
		permission: Role,
	) => void;
	load: (type: WorkbenchAccessType, id: string) => Promise<Role>;
	refresh: (type: WorkbenchAccessType, id: string) => Promise<Role>;
}

export interface WorkbenchAccessSliceState {
	entries: Record<string, WorkbenchAccessEntry>;
	actions: WorkbenchAccessActions;
}

/** Stable key for one resource's permission entry. */
export const getWorkbenchAccessKey = (
	type: WorkbenchAccessType,
	id: string,
): string => `${type}:${id}`;

/** Create the non-persisted resource permission cache for one workbench. */
export const createWorkbenchAccessSlice =
	(): WorkbenchSlice<WorkbenchAccessSliceState> => (set, get) => {
		const inFlight = new Map<string, Promise<Role>>();

		const requestPermission = (
			type: WorkbenchAccessType,
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
			type: WorkbenchAccessType,
			id: string,
			force: boolean,
		): Promise<Role> => {
			const key = getWorkbenchAccessKey(type, id);
			const current = get().access.entries[key];
			if (!force && current?.status === "SUCCESS" && current.permission) {
				return Promise.resolve(current.permission);
			}

			const pending = inFlight.get(key);
			if (pending) return pending;

			set((root) => ({
				access: {
					...root.access,
					entries: {
						...root.access.entries,
						[key]: {
							status: "LOADING",
							permission: current?.permission,
						},
					},
				},
			}));

			const request = requestPermission(type, id)
				.then((permission) => {
					set((root) => ({
						access: {
							...root.access,
							entries: {
								...root.access.entries,
								[key]: { status: "SUCCESS", permission },
							},
						},
					}));
					return permission;
				})
				.catch((error: unknown) => {
					const message =
						error instanceof Error ? error.message : String(error);
					set((root) => ({
						access: {
							...root.access,
							entries: {
								...root.access.entries,
								[key]: {
									status: "ERROR",
									permission: current?.permission,
									error: message,
								},
							},
						},
					}));
					throw error;
				})
				.finally(() => inFlight.delete(key));

			inFlight.set(key, request);
			return request;
		};

		return {
			entries: {},
			actions: {
				syncPermission: (type, id, permission) => {
					const key = getWorkbenchAccessKey(type, id);
					const current = get().access.entries[key];
					if (
						current?.status === "SUCCESS" &&
						current.permission === permission
					) {
						return;
					}

					set((root) => ({
						access: {
							...root.access,
							entries: {
								...root.access.entries,
								[key]: { status: "SUCCESS", permission },
							},
						},
					}));
				},
				load: (type, id) => fetchPermission(type, id, false),
				refresh: (type, id) => fetchPermission(type, id, true),
			},
		};
	};
