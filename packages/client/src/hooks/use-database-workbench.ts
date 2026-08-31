import { useStore } from "zustand";
import type { DatabaseWorkbenchState } from "@/stores/workbench/database";
import { getDatabaseWorkbenchStore } from "@/stores/workbench/database";
import { useWorkbench } from "./use-workbench";

/**
 * Typed accessor for the dedicated database store a `DatabaseWorkbench`
 * attaches to its workbench store via `actions.attachDomainStore`. Only valid
 * underneath a `DatabaseWorkbench`.
 *
 * The narrowing itself lives in `getDatabaseWorkbenchStore` so the untyped
 * `domainStore` attachment is cast in exactly one place, shared with the
 * non-React callers (a blueprint's `commands` / `menuItems` factory).
 */
export const useDatabaseWorkbench = <T>(
	selector: (state: DatabaseWorkbenchState) => T,
): T => {
	// Subscribed, not read once: panels can mount before the domain workbench's
	// effect attaches the store, and must re-render when it does.
	const domainStore = useWorkbench(getDatabaseWorkbenchStore);
	if (!domainStore) {
		throw new Error(
			"useDatabaseWorkbench must be used underneath a DatabaseWorkbench that attached its domain store",
		);
	}

	return useStore(domainStore, selector);
};
