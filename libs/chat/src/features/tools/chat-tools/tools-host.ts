import type { FileExplorerHost } from "@semoss/panels";

/** How a tool call runs: on its own, or once the user approves it. */
export type ClientToolExecution = "auto" | "ask";

/** The result of one client tool call, in the shape the model reads it back. */
export interface ClientToolOutcome {
	/** Whether the call failed. */
	isError: boolean;
	/** The result, or `{ error }` describing the failure. */
	payload: Record<string, unknown>;
}

/**
 * A tool the host runs in the browser, such as the desktop app's folder
 * tools. The chat offers it to the model, runs its calls, and holds the ones
 * that ask until the user approves them.
 */
export interface ClientTool {
	/** What the model calls. Part of every conversation's history: keep it. */
	readonly name: string;
	/** The name the user sees, such as "Read File". */
	readonly title: string;
	/** What the model is told the tool does. */
	readonly description: string;
	/** The JSON schema of the tool's arguments. */
	readonly inputSchema: {
		type: "object";
		properties: Record<string, Record<string, unknown>>;
		required: string[];
	};
	/** How it runs when the room's settings say nothing for it. */
	readonly usualMode: ClientToolExecution;
	/**
	 * The room's `defaultTools` setting it follows; its own name by default.
	 * The desktop app's folder tools follow the Room Files tool that does the
	 * same, such as `folder_read`.
	 */
	readonly modeKey?: string;
	/**
	 * What the model is told when the call waits for the user, added to the
	 * description.
	 */
	readonly approvalNote?: string;
	/**
	 * A one-line summary of what a call acts on, shown beside the title.
	 *
	 * @param args - The call's arguments.
	 */
	summarize?(args: Record<string, unknown>): string;
	/**
	 * Run a call. Never throws: a failure comes back as an outcome with
	 * `isError`.
	 *
	 * @param args - The call's arguments.
	 */
	run(args: Record<string, unknown>): Promise<ClientToolOutcome>;
}

/**
 * What a host adds to a room's Files panel for its own trees. The trees
 * themselves come from the host's `ChatComponents.WorkbenchFileRoots`, which
 * adds each with `useFileExplorerRoot`.
 */
export interface HostFiles {
	/** What a panel says when its mount is gone. */
	readonly missingMountMessage: string;
	/** A mount's file actions, such as Open with App. */
	readonly fileActions?: FileExplorerHost["fileActions"];
	/** A mount item's menu actions; the chat adds Add to Context to a file's. */
	readonly secondaryActions?: FileExplorerHost["secondaryActions"];
}

/** A change a host reports: its tools or files, or files in one mount. */
export interface ToolsHostChange {
	/** The mount whose files changed outside the chat. */
	readonly mountId: string;
	/** The changed paths, as the explorer has them, or none when unknown. */
	readonly paths?: string[];
}

/**
 * What a host runs in the browser for its rooms, such as the desktop app's
 * folders. Framework-free: the room store uses it. Nothing in it is specific
 * to folders.
 */
export interface ToolsHost {
	/**
	 * Whether a tool name is one of the host's, from the name alone, so past
	 * calls render as the host's before it has loaded anything.
	 *
	 * @param name - The name the model called.
	 */
	owns(name: string): boolean;
	/**
	 * A room's tools now; none for a room the host has nothing for.
	 *
	 * @param roomId - The room.
	 */
	list(roomId: string): readonly ClientTool[];
	/**
	 * A room's extra Files sources now; null for none.
	 *
	 * @param roomId - The room.
	 */
	files?(roomId: string): HostFiles | null;
	/**
	 * Hear about a room's changes: its tools or files, without an argument,
	 * or the files in one mount.
	 *
	 * @param roomId - The room.
	 * @param onChange - Called with each change.
	 * @returns Stops listening.
	 */
	subscribe(
		roomId: string,
		onChange: (change?: ToolsHostChange) => void,
	): () => void;
	/**
	 * Load what the host keeps for a room, once it is open.
	 *
	 * @param roomId - The room.
	 */
	load?(roomId: string): Promise<void>;
	/**
	 * A new chat was left before its first message, so its room is dropped.
	 *
	 * @param roomId - The dropped room.
	 */
	discard?(roomId: string): Promise<void>;
	/** What the model reads back for a call to a tool the room no longer has. */
	readonly unavailableMessage: string;
}
