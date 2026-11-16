import type { ServerConfig } from "./server-connection";

/** What checking a server found. */
export type ServerCheckResult =
	| { readonly ok: true }
	| { readonly ok: false; readonly message: string };

/** Every renderer → main call: its arguments and its result. */
export interface IpcContract {
	/** The saved server, or null before the first one is saved. */
	"server-connection:get": { request: []; response: ServerConfig | null };
	/** Whether a server answers with a SEMOSS config. */
	"server-connection:check": {
		request: [config: ServerConfig];
		response: ServerCheckResult;
	};
	/** Save a server, clear the old one's session, and reload. */
	"server-connection:set": {
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
	"server-connection:check",
	"server-connection:set",
	"shell:open-external",
] as const satisfies readonly IpcChannel[];

/** Main → renderer: what the app menu asks for. */
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
