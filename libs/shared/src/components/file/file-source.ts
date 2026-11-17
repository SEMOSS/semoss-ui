import type { FileItem } from "./file.types";
import type { FileExplorerCapabilities } from "./file-explorer.adapters";

/**
 * A tree of files the browser reaches without Pixels: a folder on the user's
 * machine through a desktop host, for instance, or a storage bucket behind a
 * host's own client. The explorer, the file panels, and a host's tools can all
 * work on one through these calls, where an asset tree's
 * `FileExplorerAdapter` only builds Pixels.
 *
 * Paths are as the explorer has them: `/` is the root, `/notes/a.md` a file in
 * it, and a directory may come with a trailing slash. A source resolves them
 * itself and must refuse one that climbs out of its root.
 *
 * Every call rejects with an `Error` whose message can be shown to the user.
 */
export interface FileSource {
	/** What the source can do; drives which affordances render at all. */
	capabilities: FileExplorerCapabilities;
	/**
	 * List a directory's direct children.
	 *
	 * @param path - The directory; `/` is the root.
	 * @returns Its entries, with paths as the explorer has them.
	 */
	list(path: string): Promise<FileItem[]>;
	/**
	 * Look up one entry, where the source can do it more cheaply than listing
	 * its folder.
	 *
	 * @param path - The entry.
	 * @returns It, or null when nothing is there.
	 */
	stat?(path: string): Promise<FileItem | null>;
	/**
	 * Search under a directory. Only called when `capabilities.search`.
	 *
	 * @param path - The directory to search under; empty means everything.
	 * @param term - What to look for.
	 * @returns The matches.
	 */
	search?(path: string, term: string): Promise<FileItem[]>;
	/**
	 * Read a file's bytes.
	 *
	 * @param path - The file.
	 * @returns Its contents.
	 */
	read(path: string): Promise<Uint8Array>;
	/**
	 * Replace a file's contents, creating it and its folders when missing.
	 *
	 * @param path - The file.
	 * @param bytes - Its new contents.
	 */
	write(path: string, bytes: Uint8Array): Promise<void>;
	/**
	 * Move or rename an entry. Rejects when the destination already exists.
	 *
	 * @param oldPath - Where it is.
	 * @param newPath - Where it goes, name included.
	 */
	move(oldPath: string, newPath: string): Promise<void>;
	/**
	 * Copy an entry, a directory with everything in it.
	 *
	 * @param oldPath - What to copy.
	 * @param newPath - Where the copy goes, name included.
	 */
	copy(oldPath: string, newPath: string): Promise<void>;
	/**
	 * Delete an entry, a directory with everything in it.
	 *
	 * @param path - What to delete.
	 */
	remove(path: string): Promise<void>;
	/**
	 * Make an empty file. Rejects when it exists.
	 *
	 * @param path - The new file, name included.
	 */
	createFile(path: string): Promise<void>;
	/**
	 * Make a directory, and any missing parents.
	 *
	 * @param path - The new directory, name included.
	 */
	createDirectory(path: string): Promise<void>;
	/**
	 * Put files from the user into a directory. Only called when
	 * `capabilities.upload`; a source without it gets each file written with
	 * {@link FileSource.write}.
	 *
	 * @param path - The directory.
	 * @param files - The files.
	 */
	upload?(path: string, files: File[]): Promise<void>;
	/**
	 * Hand entries to the user, such as saving them. Only called when
	 * `capabilities.download`.
	 *
	 * @param items - What to download.
	 */
	download?(items: FileItem[]): Promise<void>;
	/**
	 * Extract an archive beside itself. The explorer offers Unzip only when
	 * this is given.
	 *
	 * @param path - The archive.
	 */
	unzip?(path: string): Promise<void>;
}

/**
 * Put files from the user into a source's directory: through its own
 * `upload` when it has one, otherwise by writing each file's bytes.
 *
 * @param source - The source.
 * @param directory - The directory, trailing slash or not.
 * @param files - The files.
 */
export const uploadToFileSource = async (
	source: FileSource,
	directory: string,
	files: File[],
): Promise<void> => {
	if (source.upload) {
		await source.upload(directory, files);
		return;
	}

	const prefix = directory.endsWith("/") ? directory : `${directory}/`;
	for (const file of files) {
		await source.write(
			`${prefix}${file.name}`,
			new Uint8Array(await file.arrayBuffer()),
		);
	}
};
