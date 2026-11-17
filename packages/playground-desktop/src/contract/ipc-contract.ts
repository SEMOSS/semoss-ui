import type { ServerConfig } from "./server-connection";

/** What checking a server found: success, or a message saying why not. */
export type ServerCheckResult =
	| { readonly ok: true }
	| { readonly ok: false; readonly message: string };

/** The servers the app keeps a sign in for, and the one in use. */
export interface SavedServers {
	/** Every saved server, in the order they were added. */
	readonly servers: readonly ServerConfig[];
	/** The server in use; null only when none is saved. */
	readonly active: ServerConfig | null;
}

/**
 * Every renderer → main call: its arguments and its result. Main registers a
 * handler per key (`register-ipc.ts`) and the preload allowlists the same keys
 * ({@link IPC_CHANNELS}).
 */
export interface IpcContract {
	/** The server in use, or null before the first one is saved. */
	"server-connection:get": { request: []; response: ServerConfig | null };
	/** Every saved server, and the one in use. */
	"server-connection:list": { request: []; response: SavedServers };
	/** Whether a server answers with a SEMOSS config. */
	"server-connection:check": {
		request: [config: ServerConfig];
		response: ServerCheckResult;
	};
	/**
	 * Use a server: save it when it is new, then open the window on it. Every
	 * saved server keeps its own sign in, so switching back needs none.
	 */
	"server-connection:set": {
		request: [config: ServerConfig];
		response: undefined;
	};
	/**
	 * Forget a saved server and delete its sign in and storage. Forgetting the
	 * one in use opens the window on the first one left, or the connect screen.
	 */
	"server-connection:forget": {
		request: [config: ServerConfig];
		response: undefined;
	};
	/** Open a link in the system browser. */
	"shell:open-external": { request: [url: string]; response: undefined };
}

/** A renderer → main channel. */
export type IpcChannel = keyof IpcContract;

/** Runtime allowlist the preload checks; lists every IpcContract key. */
export const IPC_CHANNELS = [
	"server-connection:get",
	"server-connection:list",
	"server-connection:check",
	"server-connection:set",
	"server-connection:forget",
	"shell:open-external",
] as const satisfies readonly IpcChannel[];

/** Main → renderer: what the app menu asks the page to do. */
export type DesktopCommand =
	| { readonly type: "new-chat" }
	| { readonly type: "change-server" };

/** The channel main sends {@link DesktopCommand}s on. */
export const COMMAND_CHANNEL = "app:command";

/** What the preload exposes as `window.semossDesktop`. */
export interface DesktopBridge {
	/** Call the main process on an allowlisted channel. */
	invoke: <C extends IpcChannel>(
		channel: C,
		...args: IpcContract[C]["request"]
	) => Promise<IpcContract[C]["response"]>;
	/** Hear the main process's commands; returns the unsubscribe. */
	onCommand: (listener: (command: DesktopCommand) => void) => () => void;
}
