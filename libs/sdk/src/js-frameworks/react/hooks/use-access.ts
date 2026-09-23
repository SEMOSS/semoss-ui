import { useCallback, useContext, useEffect } from "react";
import { useStore } from "zustand/react";
import type { ResourceType } from "../../../stores/session/session.types";
import type { Role } from "../../../types";
import { AccessStoreContext } from "../contexts/access.context";

/** UI-ready state for one resource permission. */
export type ResourceAccessState =
	| { status: "loading" }
	| { status: "error"; error: string; refresh: () => Promise<Role> }
	| {
			status: "ready";
			permission: Role;
			readOnly: boolean;
			refreshing: boolean;
			refreshError?: string;
			refresh: () => Promise<Role>;
	  };

/** Resolve one resource permission from the nearest scoped access cache. */
export const useAccess = (
	type: ResourceType,
	id: string,
): ResourceAccessState => {
	const store = useContext(AccessStoreContext);
	if (!store) {
		throw new Error("useAccess must be used within an AccessProvider");
	}

	const entry = useStore(store, (state) => state.access.entries[type][id]);
	const loadPermission = useStore(
		store,
		(state) => state.access.actions.loadPermission,
	);
	const refreshPermission = useStore(
		store,
		(state) => state.access.actions.refreshPermission,
	);

	useEffect(() => {
		if (!entry) {
			void loadPermission(type, id).catch(() => undefined);
		}
	}, [entry, id, loadPermission, type]);

	const refresh = useCallback(
		() => refreshPermission(type, id),
		[id, refreshPermission, type],
	);

	if (!entry || (entry.status === "loading" && !entry.permission)) {
		return { status: "loading" };
	}
	if (entry.status === "error" && !entry.permission) {
		return { status: "error", error: entry.error.message, refresh };
	}

	const permission = entry.permission;
	if (!permission) {
		return { status: "loading" };
	}
	return {
		status: "ready",
		permission,
		readOnly: permission !== "OWNER" && permission !== "EDIT",
		refreshing: entry.status === "loading",
		refreshError:
			entry.status === "error" ? entry.error.message : undefined,
		refresh,
	};
};
