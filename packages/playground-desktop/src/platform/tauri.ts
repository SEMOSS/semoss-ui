/**
 * The Tauri 2 JavaScript API the app uses, read from `window.__TAURI__`
 * (`app.withGlobalTauri` in `tauri.conf.json`), so the web bundle carries no
 * Tauri packages. Only what the app calls is typed here; the Rust side
 * (`src-tauri/src/lib.rs`) owns every command named below.
 */

/** A window the app opens, such as the sign in window. */
export interface TauriWebviewWindow {
	/** Close the window. */
	close(): Promise<void>;
	/** Listen once for the window's `tauri://created` or `tauri://error`. */
	once(event: string, handler: (event: { payload: unknown }) => void): void;
}

/** A persisted key-value store (`tauri-plugin-store`). */
export interface TauriStore {
	get<T>(key: string): Promise<T | undefined>;
	set(key: string, value: unknown): Promise<void>;
	delete(key: string): Promise<boolean>;
	save(): Promise<void>;
}

/** What `window.__TAURI__` holds when the app runs in its Tauri shell. */
interface TauriGlobal {
	core: {
		invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
	};
	webviewWindow: {
		WebviewWindow: {
			new (
				label: string,
				options: Record<string, unknown>,
			): TauriWebviewWindow;
			getByLabel(label: string): Promise<TauriWebviewWindow | null>;
		};
	};
	store: {
		load(
			path: string,
			options?: Record<string, unknown>,
		): Promise<TauriStore>;
	};
	event: {
		listen<T>(
			event: string,
			handler: (event: { payload: T }) => void,
		): Promise<() => void>;
	};
}

/**
 * The global Tauri API, or undefined outside the desktop shell, as when the
 * web bundle runs in a browser during development.
 *
 * @returns The API.
 */
const getTauri = (): TauriGlobal | undefined =>
	(window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;

/**
 * Whether the app runs inside its Tauri shell.
 *
 * @returns True in the desktop app.
 */
export const isTauriRuntime = (): boolean => getTauri() !== undefined;

/**
 * The global Tauri API, for code that only runs in the desktop shell.
 *
 * @returns The API.
 * @throws Error outside the desktop shell.
 */
export const requireTauri = (): TauriGlobal => {
	const tauri = getTauri();
	if (!tauri) {
		throw new Error("This needs the SEMOSS desktop app.");
	}
	return tauri;
};

/**
 * Listen for an event the Rust side emits.
 *
 * @param event - The event's name.
 * @param handler - Called with each event's payload.
 * @returns Stops listening.
 */
export const listenEvent = <T>(
	event: string,
	handler: (payload: T) => void,
): Promise<() => void> =>
	requireTauri().event.listen<T>(event, (received) =>
		handler(received.payload),
	);

/**
 * Run one of the app's Rust commands.
 *
 * @param command - The command, as `lib.rs` registers it.
 * @param args - Its arguments, in camelCase as Tauri passes them.
 * @returns What the command returns.
 */
export const invokeCommand = <T>(
	command: string,
	args?: Record<string, unknown>,
): Promise<T> => requireTauri().core.invoke<T>(command, args);
