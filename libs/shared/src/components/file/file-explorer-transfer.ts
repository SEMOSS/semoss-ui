import type { FileItem } from "./file.types";
import { getItemName } from "./file-explorer.utils";

/**
 * How another explorer reads this one's tree, for a drag that copies files
 * from one tree into another: Room Files into a folder on the user's
 * machine, say. Each explorer registers its own, bound to its own insight or
 * source, so the explorer that takes the drop never needs to know where the
 * files came from.
 */
export interface FileExplorerTransferSource {
	/**
	 * List a directory's direct children.
	 *
	 * @param path - The directory.
	 * @returns Its entries.
	 */
	list(path: string): Promise<FileItem[]>;
	/**
	 * Read a file's bytes.
	 *
	 * @param path - The file.
	 * @returns Its contents.
	 */
	read(path: string): Promise<Uint8Array>;
}

/** A row drag in flight, and the explorer it started in. */
export interface FileExplorerTransferDrag {
	instanceId: string;
	items: FileItem[];
}

/** What a cross-tree drag copies, read out of the tree it came from. */
export interface FileExplorerTransferEntries {
	/** Folders to make, relative to where it lands, parents first. */
	directories: string[];
	/** Files to write, relative to where it lands. */
	files: { path: string; bytes: Uint8Array }[];
}

// Every explorer on the page, by instance id. Module scope because a drag
// crosses React subtrees: the explorer that takes the drop shares no context
// with the one it started in. It holds no state anything renders from.
const transferSources = new Map<string, FileExplorerTransferSource>();

// The browser hides a drag's data until the drop, so an explorer the drag is
// over could not otherwise tell a row drag from another explorer apart from
// a drag it cannot take.
let activeDrag: FileExplorerTransferDrag | null = null;

/**
 * Let other explorers copy out of this one.
 *
 * @param instanceId - The explorer.
 * @param source - How its tree is read.
 * @returns Removes it again.
 */
export const registerTransferSource = (
	instanceId: string,
	source: FileExplorerTransferSource,
): (() => void) => {
	transferSources.set(instanceId, source);
	return () => {
		if (transferSources.get(instanceId) === source) {
			transferSources.delete(instanceId);
		}
	};
};

/**
 * Record a row drag as it starts.
 *
 * @param drag - What is being dragged, and from where.
 */
export const startTransferDrag = (drag: FileExplorerTransferDrag): void => {
	activeDrag = drag;
};

/** Forget the drag in flight, once it is dropped or abandoned. */
export const endTransferDrag = (): void => {
	activeDrag = null;
};

/**
 * The drag in flight when it came from another explorer that can still be
 * read.
 *
 * @param instanceId - The explorer asking.
 * @returns The drag, or null for none, or for one of its own.
 */
export const getForeignTransferDrag = (
	instanceId: string,
): FileExplorerTransferDrag | null =>
	activeDrag &&
	activeDrag.instanceId !== instanceId &&
	transferSources.has(activeDrag.instanceId)
		? activeDrag
		: null;

/**
 * Read everything a drag carries out of the tree it came from, folders with
 * all they hold.
 *
 * @param drag - The drag.
 * @returns Its folders and files, relative to where they land.
 */
export const collectTransferEntries = async (
	drag: FileExplorerTransferDrag,
): Promise<FileExplorerTransferEntries> => {
	const source = transferSources.get(drag.instanceId);
	if (!source) {
		throw new Error("The files' explorer was closed");
	}

	const entries: FileExplorerTransferEntries = {
		directories: [],
		files: [],
	};
	const visit = async (item: FileItem, relativePath: string) => {
		if (item.type !== "directory") {
			entries.files.push({
				path: relativePath,
				bytes: await source.read(item.path),
			});
			return;
		}

		entries.directories.push(relativePath);
		for (const child of await source.list(item.path)) {
			await visit(child, `${relativePath}/${getItemName(child)}`);
		}
	};

	for (const item of drag.items) {
		await visit(item, getItemName(item));
	}

	return entries;
};
