import type { ReactNode } from "react";
import type { StoreApi } from "zustand";
import type { PermissionCache } from "../types/access.types";

/**
 * A store holding a standalone permission cache, as `createAccessStore`
 * makes.
 *
 * @deprecated The file panels read the SDK session's `Session.permissions`;
 * nothing in them reads this store.
 */
export type AccessStore = StoreApi<PermissionCache>;

/** Props for the deprecated {@link AccessStoreProvider}. */
interface AccessStoreProviderProps {
	/** Ignored: the file panels read the session's permissions instead. */
	store?: AccessStore;
	children: ReactNode;
}

/**
 * Renders its children, and nothing else.
 *
 * The file panels used to read permissions from the store given here. They now
 * read the SDK session's `Session.permissions`, which every view shares and a
 * sign in or out clears, so a host needs no provider and a store given here is
 * never read.
 *
 * @deprecated Remove it. To hand the panels a permission already read, call
 * `Session.permissions.sync(type, id, permission)` from `@semoss/sdk`.
 */
export function AccessStoreProvider({ children }: AccessStoreProviderProps) {
	return children;
}
