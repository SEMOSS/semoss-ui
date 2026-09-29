import type { ConnectorViewerService } from "@semoss/connectors";

/** One entry in a work folder. */
export interface FolderEntry {
	/** Path relative to the folder root, with `/` separators and no leading slash. */
	path: string;
	/** The entry's own name. */
	name: string;
	/** Whether the entry is a file or a directory. */
	kind: "file" | "directory";
	/** Size in bytes, when the source reports it. */
	size?: number;
	/** Last modified time as the source reports it, when known. */
	modified?: string;
}

/**
 * A folder the assistant can work in: the chat's own files, on the server,
 * reached through the insight asset pixels.
 *
 * Every path is relative to the folder root. Callers normalize paths with
 * `normalizeFolderPath` before handing them over, so an implementation can
 * trust that a path never climbs out of its root.
 */
export interface WorkFolderProvider {
	/** List the direct children of a directory. `""` is the root. */
	list(path: string): Promise<FolderEntry[]>;
	/** Read a file's bytes. */
	readFile(path: string): Promise<Blob>;
	/** Create a file, or replace an existing file's contents, with text. */
	writeText(path: string, content: string): Promise<void>;
	/** Create a directory and any missing parents. */
	createDirectory(path: string): Promise<void>;
	/** Move or rename an entry. The destination must not exist. */
	move(from: string, to: string): Promise<void>;
	/** Delete an entry. A non-empty directory needs `recursive`. */
	remove(path: string, recursive: boolean): Promise<void>;
	/** Describe one entry, or resolve to null when it does not exist. */
	stat(path: string): Promise<FolderEntry | null>;
}

/** What one folder call changed. */
export interface FolderChange {
	/** Path of the entry that changed, relative to the folder root. */
	path: string;
	/** What happened to it. */
	kind: "created" | "modified" | "deleted" | "moved";
	/** Where a moved entry came from. */
	from?: string;
	/** When the change finished, as an ISO string. */
	at: string;
}

/**
 * A file in the chat's own files, waiting to go with the next message, such
 * as an email a Microsoft 365 viewer saved there.
 */
export interface TeamworkContextItem {
	/** Identifies the item in the list; the file's path. */
	id: string;
	/** The file's name, shown on its chip. */
	name: string;
	/** Where the file is in the chat's files, as a message's `media` takes it. */
	path: string;
	/** The viewer it came from. */
	service: ConnectorViewerService;
}
