import { decodeBase64Asset, getFileExplorerAdapter } from "@semoss/shared";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import {
	getFolderPathName,
	getParentFolderPath,
	joinFolderPath,
	splitFolderPath,
} from "./folder-path";
import { FolderToolError } from "./folder-text";
import { ROOM_FILES_NAME } from "./folder-tools";

/** One entry in Room Files. */
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
 * A folder the chat's file tools work in: Room Files, or the folders attached
 * from the user's machine. Every path is relative to the folder root, with `/`
 * separators and no leading slash, and normalized before it reaches the
 * folder, so it never climbs out.
 */
export interface ToolFolder {
	/** How the tools name the folder to the model, such as Room Files. */
	readonly displayName: string;
	/** What its tools are called before their operation, such as `folder`. */
	readonly toolPrefix: string;
	/**
	 * List a directory's direct children.
	 *
	 * @param path - A directory; `""` is the root.
	 */
	list(path: string): Promise<FolderEntry[]>;
	/**
	 * Read a file's bytes.
	 *
	 * @param path - A file.
	 */
	readFile(path: string): Promise<Blob>;
	/**
	 * Create or replace a text file, making its folders.
	 *
	 * @param path - A file.
	 * @param content - Its text.
	 */
	writeText(path: string, content: string): Promise<void>;
	/**
	 * Create a directory and its parents.
	 *
	 * @param path - The directory.
	 */
	createDirectory(path: string): Promise<void>;
	/**
	 * Move or rename an entry.
	 *
	 * @param from - Where it is.
	 * @param to - Where it goes.
	 */
	move(from: string, to: string): Promise<void>;
	/**
	 * Delete an entry, a directory with what it holds.
	 *
	 * @param path - The entry.
	 */
	remove(path: string): Promise<void>;
	/**
	 * Look up one entry.
	 *
	 * @param path - The entry; `""` is the root.
	 * @returns The entry, or null when nothing is there.
	 */
	stat(path: string): Promise<FolderEntry | null>;
}

/**
 * Run one pixel and resolve to its first statement's output, throwing when
 * the pixel reports an error.
 */
export type PixelOutputRunner = (pixel: string) => Promise<unknown>;

/** The insight asset pixels, shared with the file explorer. */
const ROOM_ASSETS = getFileExplorerAdapter({ type: "INSIGHT" });

/**
 * Top level entries the folder hides and never touches. The room's tool
 * settings live in `mcp`: rewriting or deleting it would switch the chat's
 * tools and connectors off.
 */
const RESERVED_NAMES: readonly string[] = ["mcp", ".git", ".admin"];

/**
 * Characters the asset pixels cannot carry: several of them interpolate the
 * path into a quoted string as is.
 */
const UNSAFE_ASSET_PATH = /["\\]/;

/**
 * Whether a path falls under one of the reserved top level entries.
 *
 * @param path - A normalized path inside the folder.
 * @returns True when the folder hides and never touches it.
 */
const isReserved = (path: string): boolean => {
	const [top] = splitFolderPath(path);
	return (
		top !== undefined &&
		RESERVED_NAMES.some((name) => name.toLowerCase() === top.toLowerCase())
	);
};

/** One row of a `BrowseInsightAssets` listing. */
interface AssetRow {
	/** The entry's own name. */
	name?: unknown;
	/** `directory` for a folder; anything else is a file. */
	type?: unknown;
	/** When the entry last changed, as the server reports it. */
	lastModified?: unknown;
}

/**
 * The room's own files ("Room Files"), read and written through the insight
 * asset pixels. The pixels run against the room's insight, whose folder is the
 * room's once the room is bound to it. The user's uploads and saved downloads
 * are here, and the chat's other tools read and write it too.
 *
 * Every path is relative to the folder root and normalized with
 * `normalizeFolderPath` before it reaches this class, so it never climbs out.
 * The root itself is never written, moved, or deleted: `DeleteInsightAssets`
 * without a path clears the whole space, so an empty path must never reach
 * it. The reserved top level entries are hidden from listings and refused.
 */
export class RoomFolder implements ToolFolder {
	readonly displayName = ROOM_FILES_NAME;
	readonly toolPrefix = "folder";

	/**
	 * @param run - Runs the insight asset pixels against the room's insight.
	 */
	constructor(private readonly run: PixelOutputRunner) {}

	/**
	 * List a directory's direct children, leaving out reserved entries.
	 *
	 * @param path - A normalized directory path; `""` is the root.
	 * @returns The entries.
	 */
	async list(path: string): Promise<FolderEntry[]> {
		const output = await this.run(
			ROOM_ASSETS.browse(this.toAssetPath(path, true)),
		);
		if (!Array.isArray(output)) {
			return [];
		}

		return output.reduce<FolderEntry[]>((entries, row: AssetRow) => {
			if (typeof row?.name !== "string" || !row.name) {
				return entries;
			}
			const entryPath = joinFolderPath(path, row.name);
			if (isReserved(entryPath)) {
				return entries;
			}
			entries.push({
				path: entryPath,
				name: row.name,
				kind: row.type === "directory" ? "directory" : "file",
				modified:
					typeof row.lastModified === "string"
						? row.lastModified
						: undefined,
			});
			return entries;
		}, []);
	}

	/**
	 * Read a file's bytes.
	 *
	 * @param path - A normalized file path.
	 * @returns The file's contents.
	 * @throws FolderToolError when the contents do not come back as base64.
	 */
	async readFile(path: string): Promise<Blob> {
		const output = await this.run(
			ROOM_ASSETS.read(this.toAssetPath(path, false), true),
		);
		const bytes =
			typeof output === "string" ? decodeBase64Asset(output) : null;
		if (!bytes) {
			// an empty file comes back as an empty string
			if (output === "") {
				return new Blob([]);
			}
			throw new FolderToolError(`Could not read ${path}.`);
		}
		// slice() yields a copy backed by a plain ArrayBuffer, which Blob takes
		return new Blob([bytes.slice()]);
	}

	/**
	 * Create a file, or replace its contents, with text.
	 *
	 * @param path - A normalized file path.
	 * @param content - The file's new contents.
	 */
	async writeText(path: string, content: string): Promise<void> {
		// base64 carries any text, including a literal closing encode marker
		// that would end a plain `<encode>` block early
		const encoded = encodeBytesToBase64(new TextEncoder().encode(content));
		await this.run(
			ROOM_ASSETS.save(this.toAssetPath(path, false), encoded, true),
		);
	}

	/**
	 * Create a directory and any missing parents.
	 *
	 * @param path - A normalized directory path.
	 */
	async createDirectory(path: string): Promise<void> {
		await this.run(
			ROOM_ASSETS.createDirectory(this.toAssetPath(path, false)),
		);
	}

	/**
	 * Move or rename an entry.
	 *
	 * @param from - The entry's normalized path.
	 * @param to - Where it goes; nothing may exist there.
	 * @throws FolderToolError when `from` is missing or `to` is taken.
	 */
	async move(from: string, to: string): Promise<void> {
		const source = await this.stat(from);
		if (!source) {
			throw new FolderToolError(`Nothing exists at ${from}.`);
		}
		if (await this.stat(to)) {
			throw new FolderToolError(
				`Something already exists at ${to}. Choose another destination, or delete it first.`,
			);
		}
		await this.run(
			ROOM_ASSETS.rename(
				this.toAssetPath(from, false),
				this.toAssetPath(to, false),
			),
		);
	}

	/**
	 * Delete an entry, a folder with everything in it. The reactor deletes
	 * folders with their contents; the tool layer has already confirmed a
	 * non-empty folder was meant to go.
	 *
	 * @param path - The entry's normalized path.
	 */
	async remove(path: string): Promise<void> {
		await this.run(ROOM_ASSETS.remove(this.toAssetPath(path, false)));
	}

	/**
	 * Describe one entry, found by listing its parent.
	 *
	 * @param path - A normalized path; `""` is the folder root.
	 * @returns The entry, or null when it does not exist or is reserved.
	 */
	async stat(path: string): Promise<FolderEntry | null> {
		if (!path) {
			return { path: "", name: "", kind: "directory" };
		}
		if (isReserved(path)) {
			return null;
		}

		const name = getFolderPathName(path);
		let siblings: FolderEntry[];
		try {
			siblings = await this.list(getParentFolderPath(path));
		} catch {
			// the parent does not exist, so neither does the entry
			return null;
		}
		return siblings.find((entry) => entry.name === name) ?? null;
	}

	/**
	 * The path the asset pixels expect, which is rooted at the space with a
	 * leading slash, the same form the file explorer sends.
	 *
	 * @param path - A normalized path inside the folder.
	 * @param allowRoot - Whether the folder root itself may be addressed.
	 * @returns The space's path.
	 * @throws FolderToolError when the root is not allowed, the path is
	 * reserved, or the path cannot be carried by a pixel.
	 */
	private toAssetPath(path: string, allowRoot: boolean): string {
		if (!path) {
			if (!allowRoot) {
				throw new FolderToolError(
					"That operation needs a path inside the work folder, not the folder itself.",
				);
			}
			return "";
		}
		if (isReserved(path)) {
			throw new FolderToolError(`Nothing exists at ${path}.`);
		}
		if (UNSAFE_ASSET_PATH.test(path)) {
			throw new FolderToolError(
				`Paths in ${ROOM_FILES_NAME} cannot contain double quotes or backslashes.`,
			);
		}
		return `/${path}`;
	}
}
