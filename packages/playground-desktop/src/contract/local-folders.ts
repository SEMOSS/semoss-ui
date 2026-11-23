/** A folder attached to a room, as the page sees it: never its path on the machine. */
export interface LocalFolderGrant {
	/** The attachment's id, the same across restarts. */
	readonly id: string;
	/** The folder's name, unique among the room's folders. */
	readonly name: string;
}

/** Which attached folder a file call works in. */
export interface LocalFolderRef {
	readonly roomId: string;
	readonly folderId: string;
}

/** One entry in an attached folder, with a path as the explorer has it (`/` is the folder). */
export interface LocalFileEntry {
	readonly name: string;
	readonly path: string;
	/** Set for a folder; anything else is a file. */
	readonly type?: "directory";
	/** Size in bytes. */
	readonly size?: number;
	/** When it last changed, as an ISO date. */
	readonly lastModified?: string;
}

/** The most matches one attached folder's search returns. */
export const MAX_FOLDER_SEARCH_RESULTS = 500;

/** What a search of an attached folder found. */
export interface LocalFolderSearchResult {
	/** The matches, as the listing has them, nearest first. */
	readonly entries: LocalFileEntry[];
	/** Whether it stopped at its limit or its time budget, leaving some out. */
	readonly isTruncated: boolean;
}

/**
 * Whether a value names an attached folder. The page's arguments arrive
 * untyped, so every file call checks its reference with this.
 *
 * @param value - The argument.
 * @returns True for `{ roomId, folderId }` with both ids.
 */
export const isLocalFolderRef = (value: unknown): value is LocalFolderRef =>
	typeof value === "object" &&
	value !== null &&
	isLocalFolderId((value as LocalFolderRef).roomId) &&
	isLocalFolderId((value as LocalFolderRef).folderId);

/**
 * Whether a value can be a room or attachment id: non-empty text without `|`,
 * which main uses to join them into one watch's key.
 *
 * @param value - The value.
 * @returns True for an id.
 */
export const isLocalFolderId = (value: unknown): value is string =>
	typeof value === "string" && value.length > 0 && !value.includes("|");
