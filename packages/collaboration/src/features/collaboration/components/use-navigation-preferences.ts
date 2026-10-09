import { useState } from "react";

interface NavigationPreferences {
	/** Whether desktop navigation is displayed as an icon rail. */
	isCollapsed: boolean;
}

interface NavigationPreferenceState extends NavigationPreferences {
	storageKey: string;
}

/** Isolate optional navigation metadata by deployment and signed-in account. */
export function navigationStorageKey(
	account: string,
	deployment: string,
): string {
	return `semoss:collaboration:navigation:v1:${encodeURIComponent(deployment)}:${encodeURIComponent(account)}`;
}

/** Restore the rail preference without reading obsolete topic disclosures. */
function readPreferences(storageKey: string): NavigationPreferenceState {
	const preferences: NavigationPreferenceState = {
		storageKey,
		isCollapsed: false,
	};
	try {
		const storage = window.localStorage;
		preferences.isCollapsed =
			storage.getItem(`${storageKey}:isCollapsed`) === "true";
	} catch {
		// Optional preferences use their defaults when storage is unavailable.
	}
	return preferences;
}

/** Apply optional preferences even when browser persistence is blocked. */
function writePreference(key: string, value: boolean): void {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// The user's choice still applies for the current session.
	}
}

/** Persist the account-scoped rail choice without storing room records. */
export function useNavigationPreferences(
	account: string,
	deployment: string,
): NavigationPreferences & {
	setIsCollapsed: (value: boolean) => void;
} {
	const storageKey = navigationStorageKey(account, deployment);
	const [state, setState] = useState(() => readPreferences(storageKey));
	let preferences = state;
	if (state.storageKey !== storageKey) {
		// Reset during render so a new account never sees the prior account's state.
		preferences = readPreferences(storageKey);
		setState(preferences);
	}

	return {
		isCollapsed: preferences.isCollapsed,
		setIsCollapsed: (value) => {
			setState((current) =>
				current.storageKey === storageKey
					? { ...current, isCollapsed: value }
					: current,
			);
			writePreference(`${storageKey}:isCollapsed`, value);
		},
	};
}
