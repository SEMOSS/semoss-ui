import { useState } from "react";

interface NavigationPreferences {
	/** Whether desktop navigation is displayed as an icon rail. */
	isCollapsed: boolean;
	/** Whether the Topics disclosure is expanded. */
	isTopicsOpen: boolean;
	/** Whether the Sessions disclosure is expanded. */
	isSessionsOpen: boolean;
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

/** Accept stored JSON booleans and otherwise retain each preference's default. */
function readPreference(key: string, defaultValue = false): boolean {
	try {
		const stored = window.localStorage.getItem(key);
		return stored === "true"
			? true
			: stored === "false"
				? false
				: defaultValue;
	} catch {
		return defaultValue;
	}
}

/** Each preference is independent so one malformed value cannot reset the other. */
function readPreferences(storageKey: string): NavigationPreferenceState {
	return {
		storageKey,
		isCollapsed: readPreference(`${storageKey}:isCollapsed`),
		isTopicsOpen: readPreference(`${storageKey}:isTopicsOpen`),
		isSessionsOpen: readPreference(`${storageKey}:isSessionsOpen`, true),
	};
}

/** Persist optional shell preferences while retaining usable state if storage fails. */
export function useNavigationPreferences(
	account: string,
	deployment: string,
): NavigationPreferences & {
	setIsCollapsed: (value: boolean) => void;
	setIsTopicsOpen: (value: boolean) => void;
	setIsSessionsOpen: (value: boolean) => void;
} {
	const storageKey = navigationStorageKey(account, deployment);
	const [state, setState] = useState(() => readPreferences(storageKey));
	let preferences = state;
	if (state.storageKey !== storageKey) {
		// Reset during render so a new account never sees the prior account's state.
		preferences = readPreferences(storageKey);
		setState(preferences);
	}

	/** Write individual fields to preserve other preferences during batched events. */
	function updatePreference(
		preference: keyof NavigationPreferences,
		value: boolean,
	): void {
		setState((current) =>
			current.storageKey === storageKey
				? { ...current, [preference]: value }
				: current,
		);
		try {
			window.localStorage.setItem(
				`${storageKey}:${preference}`,
				JSON.stringify(value),
			);
		} catch {
			// These preferences remain usable for this session when storage is blocked.
		}
	}

	return {
		isCollapsed: preferences.isCollapsed,
		isTopicsOpen: preferences.isTopicsOpen,
		isSessionsOpen: preferences.isSessionsOpen,
		setIsCollapsed: (value) => updatePreference("isCollapsed", value),
		setIsTopicsOpen: (value) => updatePreference("isTopicsOpen", value),
		setIsSessionsOpen: (value) => updatePreference("isSessionsOpen", value),
	};
}
