import type {
	LocalFileEntry,
	LocalFolderGrant,
	LocalFolderRef,
} from "./local-folders";
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
	/** The folders attached to a room on the server in use. */
	"local-folders:list": {
		request: [roomId: string];
		response: LocalFolderGrant[];
	};
	/**
	 * Ask the user for folders with the system's folder picker and attach
	 * them to a room. The only way a folder is attached: the page never names
	 * a path on the machine.
	 */
	"local-folders:pick": {
		request: [roomId: string];
		response: LocalFolderGrant[];
	};
	/** Detach a folder from a room, leaving the folder as it is. */
	"local-folders:detach": {
		request: [ref: LocalFolderRef];
		response: LocalFolderGrant[];
	};
	/** Send `local-folders-changed` commands while the folder changes. Counted: one unwatch each. */
	"local-folders:watch": {
		request: [ref: LocalFolderRef];
		response: undefined;
	};
	/** Stop one watch. */
	"local-folders:unwatch": {
		request: [ref: LocalFolderRef];
		response: undefined;
	};
	/** A folder's entries; paths are inside the attached folder, `/` being it. */
	"local-fs:list": {
		request: [ref: LocalFolderRef, path: string];
		response: LocalFileEntry[];
	};
	/** One entry, or null when nothing is there. */
	"local-fs:stat": {
		request: [ref: LocalFolderRef, path: string];
		response: LocalFileEntry | null;
	};
	/** A file's bytes. */
	"local-fs:read": {
		request: [ref: LocalFolderRef, path: string];
		response: Uint8Array;
	};
	/** Replace a file's bytes, making it and its folders when missing. */
	"local-fs:write": {
		request: [ref: LocalFolderRef, path: string, bytes: Uint8Array];
		response: undefined;
	};
	/** Make an empty file; fails when it exists. */
	"local-fs:create-file": {
		request: [ref: LocalFolderRef, path: string];
		response: undefined;
	};
	/** Make a folder and its parents. */
	"local-fs:create-directory": {
		request: [ref: LocalFolderRef, path: string];
		response: undefined;
	};
	/** Move or rename an entry; fails when the destination exists. */
	"local-fs:move": {
		request: [ref: LocalFolderRef, from: string, to: string];
		response: undefined;
	};
	/** Copy an entry, a folder with what it holds; fails when the destination exists. */
	"local-fs:copy": {
		request: [ref: LocalFolderRef, from: string, to: string];
		response: undefined;
	};
	/** Move an entry to the system's trash. */
	"local-fs:remove": {
		request: [ref: LocalFolderRef, path: string];
		response: undefined;
	};
	/** Open an entry with the app the system opens it with. */
	"local-fs:open": {
		request: [ref: LocalFolderRef, path: string];
		response: undefined;
	};
	/** Show an entry in the system's file manager. */
	"local-fs:reveal": {
		request: [ref: LocalFolderRef, path: string];
		response: undefined;
	};
}

/** A renderer → main channel. */
export type IpcChannel = keyof IpcContract;

/**
 * Every channel, as an object so the compiler checks the list: a channel
 * added to {@link IpcContract} and left out here fails to compile, and so
 * does one listed here that the contract does not have.
 */
const IPC_CHANNEL_LIST: Record<IpcChannel, true> = {
	"server-connection:get": true,
	"server-connection:list": true,
	"server-connection:check": true,
	"server-connection:set": true,
	"server-connection:forget": true,
	"shell:open-external": true,
	"local-folders:list": true,
	"local-folders:pick": true,
	"local-folders:detach": true,
	"local-folders:watch": true,
	"local-folders:unwatch": true,
	"local-fs:list": true,
	"local-fs:stat": true,
	"local-fs:read": true,
	"local-fs:write": true,
	"local-fs:create-file": true,
	"local-fs:create-directory": true,
	"local-fs:move": true,
	"local-fs:copy": true,
	"local-fs:remove": true,
	"local-fs:open": true,
	"local-fs:reveal": true,
};

/** Runtime allowlist the preload checks: every {@link IpcContract} key. */
export const IPC_CHANNELS = Object.keys(IPC_CHANNEL_LIST) as IpcChannel[];

/** Main → renderer: what the app menu asks the page to do, and what it hears from the machine. */
export type DesktopCommand =
	| { readonly type: "new-chat" }
	| { readonly type: "change-server" }
	| {
			/** A watched folder changed outside the app. */
			readonly type: "local-folders-changed";
			readonly roomId: string;
			readonly folderId: string;
			/** What changed, inside the folder; none when the system could not say. */
			readonly paths?: readonly string[];
	  };

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
