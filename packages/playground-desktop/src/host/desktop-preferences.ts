import {
	type ChatPreferencesAdapter,
	parseSelectedModelPreference,
} from "@semoss/sdk";
import type { AppStore } from "../platform/app-store";

/**
 * The picked model, per instance, in the app's preferences file, so it
 * survives restarts. The adapter's reads are synchronous, so the stored
 * picks are read once when the app starts and written through after.
 *
 * @param store - The app's preferences.
 * @param instanceId - The instance in use.
 * @returns The adapter.
 */
export const createDesktopPreferences = async (
	store: AppStore,
	instanceId: string,
): Promise<ChatPreferencesAdapter> => {
	let stored: unknown;
	try {
		stored = await store.get("selectedModels");
	} catch {
		stored = undefined;
	}
	const picks: Record<string, unknown> =
		typeof stored === "object" && stored !== null
			? { ...(stored as Record<string, unknown>) }
			: {};

	return {
		readSelectedModel: () => {
			return parseSelectedModelPreference(picks[instanceId]);
		},
		writeSelectedModel: (preference) => {
			picks[instanceId] = preference;
			// an optional preference: a failed write keeps the default
			void store
				.set("selectedModels", { ...picks })
				.catch(() => undefined);
		},
	};
};
