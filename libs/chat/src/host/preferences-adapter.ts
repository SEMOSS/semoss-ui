import {
	type ChatPreferencesAdapter,
	parseSelectedModelPreference,
} from "@semoss/sdk";

/** The tab storage key the playground has always used for the model. */
const SESSION_MODEL_KEY = "smss-playground-session-model";

/**
 * Preferences kept in the tab's `sessionStorage`, so a refresh keeps the
 * model picked in this login and a new tab starts from the defaults.
 *
 * @returns The adapter.
 */
export const createSessionStoragePreferences = (): ChatPreferencesAdapter => ({
	readSelectedModel: () => {
		try {
			const item = sessionStorage.getItem(SESSION_MODEL_KEY);
			if (!item) {
				return null;
			}
			return parseSelectedModelPreference(JSON.parse(item));
		} catch {
			return null;
		}
	},
	writeSelectedModel: (preference) => {
		try {
			sessionStorage.setItem(
				SESSION_MODEL_KEY,
				JSON.stringify(preference),
			);
		} catch {
			// an optional preference; a full or blocked store keeps the default
		}
	},
});
