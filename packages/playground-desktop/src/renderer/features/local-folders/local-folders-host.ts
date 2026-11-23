import type { FileSource } from "@semoss/shared";

/** One attached folder's files, and whether its last search left some out. */
export interface FolderSource extends FileSource {
	/** Whether the last search stopped at its limit or time budget. */
	readonly isSearchTruncated?: boolean;
}

/** A folder from the user's machine, attached to one room. */
export interface LocalFolder {
	/** The attachment's id: the same across restarts, so panels opened on it come back. */
	id: string;
	/** What the folder is called, unique among the room's folders. */
	name: string;
}

/**
 * What a host that can reach the user's own files gives the chat, such as the
 * desktop app. The chat never sees a path on the machine: it names a folder
 * by the room and the attachment's id, and a file by its path inside it.
 *
 * Where the attachments are kept is the host's business; the desktop app
 * keeps them on the machine, for each server and room.
 */
export interface LocalFoldersHost {
	/**
	 * The folders attached to a room.
	 *
	 * @param roomId - The room.
	 * @returns Its folders, in the order they were attached.
	 */
	list(roomId: string): Promise<LocalFolder[]>;
	/**
	 * Ask the user to pick folders, and attach them to a room.
	 *
	 * @param roomId - The room.
	 * @returns The room's folders afterwards; unchanged when the user cancels.
	 */
	pick(roomId: string): Promise<LocalFolder[]>;
	/**
	 * Detach a folder from a room. The folder itself is left as it is.
	 *
	 * @param roomId - The room.
	 * @param folderId - The attachment.
	 * @returns The room's folders afterwards.
	 */
	detach(roomId: string, folderId: string): Promise<LocalFolder[]>;
	/**
	 * A folder's files, for the explorer, the file panels, and the tools.
	 * Return the same object for the same folder.
	 *
	 * @param roomId - The room.
	 * @param folderId - The attachment.
	 * @returns Its source.
	 */
	source(roomId: string, folderId: string): FolderSource;
	/**
	 * Open a file or folder in the app the machine opens it with.
	 *
	 * @param roomId - The room.
	 * @param folderId - The attachment.
	 * @param path - Inside the folder, as the explorer has it.
	 */
	open(roomId: string, folderId: string, path: string): Promise<void>;
	/**
	 * Show a file or folder in the machine's file manager.
	 *
	 * @param roomId - The room.
	 * @param folderId - The attachment.
	 * @param path - Inside the folder, as the explorer has it.
	 */
	reveal(roomId: string, folderId: string, path: string): Promise<void>;
	/**
	 * Hear about changes made to a folder outside the chat, such as a file
	 * saved in another app.
	 *
	 * @param roomId - The room.
	 * @param folderId - The attachment.
	 * @param onChange - Called with the changed paths, as the explorer has
	 * them, or none when the host cannot tell.
	 * @returns Stops listening.
	 */
	watch(
		roomId: string,
		folderId: string,
		onChange: (paths?: string[]) => void,
	): () => void;
	/** The machine's file manager, such as Finder, for Show in Finder. */
	readonly fileManagerName: string;
}
