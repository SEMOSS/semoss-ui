import { useCallback, useEffect } from "react";
import type { Role } from "@semoss/sdk";
import {
	getWorkbenchAccessKey,
	type WorkbenchAccessType,
} from "@/stores/workbench";
import { useWorkbench } from "./use-workbench";

/** Still resolving a resource's permission for the first time. */
interface WorkbenchAccessLoadingState {
	status: "loading";
}

/** Permission has never resolved and there is no stale value to fall back on. */
interface WorkbenchAccessErrorState {
	status: "error";
	error: string;
	refresh: () => Promise<Role>;
}

/** Permission is known — either fresh, mid-refresh, or stale after a failed refresh. */
interface WorkbenchAccessReadyState {
	status: "ready";
	permission: Role;
	readOnly: boolean;
	/** A background refresh is in flight; last-known permission is still shown. */
	refreshing: boolean;
	/** Set when the most recent refresh failed; last-known permission is still shown. */
	refreshError?: string;
	refresh: () => Promise<Role>;
}

export type WorkbenchAccessState =
	| WorkbenchAccessLoadingState
	| WorkbenchAccessErrorState
	| WorkbenchAccessReadyState;

/** Lazily resolve and cache access for one workbench resource. */
export const useWorkbenchAccess = (
	type: WorkbenchAccessType,
	id: string,
): WorkbenchAccessState => {
	const key = getWorkbenchAccessKey(type, id);
	const entry = useWorkbench((state) => state.access.entries[key]);
	const actions = useWorkbench((state) => state.access.actions);

	useEffect(() => {
		if (!entry) {
			void actions.load(type, id).catch(() => undefined);
		}
	}, [actions, entry, id, type]);

	const refresh = useCallback(
		() => actions.refresh(type, id),
		[actions, id, type],
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
