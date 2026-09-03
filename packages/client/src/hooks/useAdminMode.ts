import { useSyncExternalStore } from "react";

/**
 * localStorage key backing the "admin mode" toggle. Owned here so
 * `SettingsLayout` and any route outside the Settings context tree (which
 * cannot use `useSettings()`, since `SettingsContext` has no default value)
 * read/write the exact same key instead of duplicating the string.
 */
export const ADMIN_MODE_STORAGE_KEY = "semoss.adminMode";

/**
 * Reads the persisted admin-mode flag directly from localStorage. Safe to
 * call outside React (e.g. in `SettingsLayout`'s `useState` initializer).
 */
export function getStoredAdminMode(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === "true";
}

function subscribe(callback: () => void): () => void {
	window.addEventListener("storage", callback);
	return () => window.removeEventListener("storage", callback);
}

/**
 * Reads the "admin mode" toggle for routes that render outside the Settings
 * layout (e.g. the landing page, app catalog, new-app modal) where
 * `useSettings()` isn't available. This intentionally does not gate on
 * `configStore.store.user.admin` itself — callers combine the two the same
 * way `SettingsLayout` does (`configStore.store.user.admin && adminMode`).
 *
 * Note: like a plain `localStorage` read, this only reacts to changes made
 * from *other* tabs/windows (the browser `storage` event does not fire for
 * same-tab writes). Toggling admin mode in Settings and expecting an
 * already-mounted component in another tab of the app to update live would
 * still require a shared context/provider — out of scope for this hook.
 */
export function useAdminMode(): boolean {
	return useSyncExternalStore(subscribe, getStoredAdminMode, () => false);
}
