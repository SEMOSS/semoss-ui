import { isTauriRuntime, requireTauri, type TauriStore } from "./tauri";

/**
 * The app's preferences file in its data directory (`tauri-plugin-store`).
 * It holds the saved instances and choices such as the picked model; never a
 * token, cookie or secret — those live in the system keychain
 * (`keychain.ts`).
 */
const PREFERENCES_FILE = "preferences.json";

/** The values the preferences file holds, by key. */
export interface AppPreferences {
	/** The instances the user saved, and the one in use. */
	instances: unknown;
	/** The model last picked, per instance (`ChatPreferencesAdapter`). */
	selectedModels: unknown;
}

/** Reads and writes the preferences file. */
export interface AppStore {
	get<K extends keyof AppPreferences>(
		key: K,
	): Promise<AppPreferences[K] | undefined>;
	set<K extends keyof AppPreferences>(
		key: K,
		value: AppPreferences[K],
	): Promise<void>;
}

/**
 * A store that lives only as long as the page, for the web bundle in a
 * browser during development and for tests.
 *
 * @returns The store.
 */
export const createMemoryAppStore = (): AppStore => {
	const values = new Map<string, unknown>();
	return {
		get: async (key) =>
			values.get(key) as AppPreferences[typeof key] | undefined,
		set: async (key, value) => {
			values.set(key, value);
		},
	};
};

/**
 * The preferences file through `tauri-plugin-store`, saved after each write.
 *
 * @param store - The plugin's loaded store.
 * @returns The store.
 */
const createTauriAppStore = (store: TauriStore): AppStore => ({
	get: (key) => store.get(key),
	set: async (key, value) => {
		await store.set(key, value);
		await store.save();
	},
});

/**
 * The app's preferences: the file in the app's data directory in the
 * desktop shell, or memory in a browser.
 *
 * @returns The store.
 */
export const loadAppStore = async (): Promise<AppStore> =>
	isTauriRuntime()
		? createTauriAppStore(
				await requireTauri().store.load(PREFERENCES_FILE, {
					autoSave: false,
				}),
			)
		: createMemoryAppStore();
