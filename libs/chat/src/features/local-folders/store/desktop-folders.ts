import type { FileItem, FileSource } from "@semoss/shared";
import {
	DESKTOP_FOLDERS_NAME,
	type FolderToolPrefix,
} from "../../tools/default-tools/folder-tools";
import { splitFolderPath } from "../../tools/folders/folder-path";
import { FolderToolError } from "../../tools/folders/folder-text";
import type { FolderEntry, ToolFolder } from "../../tools/folders/room-folder";

/** One attached folder, as the tools reach it. */
export interface DesktopFolder {
	/** The folder's name: the top level entry its files are under. */
	name: string;
	/** Where its files are read and written. */
	source: FileSource;
}

/** Where a tool path lands: which folder, and the path inside it. */
interface ResolvedPath {
	folder: DesktopFolder;
	/** The path in the folder's source, such as `/notes/a.md`; `/` is its root. */
	sourcePath: string;
}

/**
 * The folders attached from the user's machine, as one folder for the chat's
 * file tools. Each attached folder is a top level entry named after it, so
 * `notes/q3.md` is `q3.md` in the folder called notes. The top level itself
 * holds only the attached folders: nothing can be written there, and an
 * attached folder can be detached but never moved or deleted by a tool.
 */
export class DesktopFolders implements ToolFolder {
	readonly displayName = DESKTOP_FOLDERS_NAME;
	readonly toolPrefix: FolderToolPrefix = "desktop";

	/**
	 * @param folders - The attached folders, each with its own name.
	 */
	constructor(private readonly folders: readonly DesktopFolder[]) {}

	/** The attached folders' names, which the tools are told about. */
	get folderNames(): string[] {
		return this.folders.map((folder) => folder.name);
	}

	async list(path: string): Promise<FolderEntry[]> {
		if (!path) {
			return this.folders.map((folder) => ({
				path: folder.name,
				name: folder.name,
				kind: "directory",
			}));
		}
		const { folder, sourcePath } = this.resolve(path);
		const items = await folder.source.list(sourcePath);
		return items.map((item) => this.toEntry(folder, item));
	}

	async stat(path: string): Promise<FolderEntry | null> {
		if (!path) {
			return { path: "", name: DESKTOP_FOLDERS_NAME, kind: "directory" };
		}
		const { folder, sourcePath } = this.resolve(path);
		if (sourcePath === "/") {
			return { path: folder.name, name: folder.name, kind: "directory" };
		}
		if (folder.source.stat) {
			const item = await folder.source.stat(sourcePath);
			return item ? this.toEntry(folder, item) : null;
		}
		// a source with no lookup of its own is asked for the parent's listing
		const segments = splitFolderPath(path);
		const name = segments[segments.length - 1];
		const parent = segments.slice(0, -1).join("/");
		const siblings = await this.list(parent);
		return siblings.find((entry) => entry.name === name) ?? null;
	}

	async readFile(path: string): Promise<Blob> {
		const { folder, sourcePath } = this.resolveInside(path);
		const bytes = await folder.source.read(sourcePath);
		return new Blob([new Uint8Array(bytes)]);
	}

	async writeText(path: string, content: string): Promise<void> {
		const { folder, sourcePath } = this.resolveInside(path);
		await folder.source.write(
			sourcePath,
			new TextEncoder().encode(content),
		);
	}

	async createDirectory(path: string): Promise<void> {
		const { folder, sourcePath } = this.resolveInside(path);
		await folder.source.createDirectory(sourcePath);
	}

	async move(from: string, to: string): Promise<void> {
		const source = this.resolveInside(from);
		const target = this.resolveInside(to);
		if (source.folder !== target.folder) {
			throw new FolderToolError(
				"Moving between attached folders is not supported. Read the file and write it to the other folder, then delete the original.",
			);
		}
		await source.folder.source.move(source.sourcePath, target.sourcePath);
	}

	async remove(path: string): Promise<void> {
		const { folder, sourcePath } = this.resolveInside(path);
		await folder.source.remove(sourcePath);
	}

	/**
	 * Which folder a tool path is in, and the path inside it.
	 *
	 * @param path - A normalized tool path that names a folder.
	 * @returns The folder and its source path.
	 */
	private resolve(path: string): ResolvedPath {
		const [name, ...rest] = splitFolderPath(path);
		const folder = this.folders.find(
			(candidate) => candidate.name === name,
		);
		if (!folder) {
			throw new FolderToolError(
				`${name ?? path} is not an attached folder. Paths start with one of: ${this.folderNames.join(", ") || "(no folders are attached)"}.`,
			);
		}
		return { folder, sourcePath: `/${rest.join("/")}` };
	}

	/**
	 * Like {@link resolve}, for a path that has to be inside a folder rather
	 * than the folder itself, which a tool may not write, move, or delete.
	 *
	 * @param path - A normalized tool path.
	 * @returns The folder and its source path.
	 */
	private resolveInside(path: string): ResolvedPath {
		const resolved = this.resolve(path);
		if (resolved.sourcePath === "/") {
			throw new FolderToolError(
				`${path} is an attached folder itself. Name something inside it; the user detaches folders from the chat.`,
			);
		}
		return resolved;
	}

	/**
	 * A source's item, as a tool entry under its folder.
	 *
	 * @param folder - The folder it is in.
	 * @param item - The item, with a source path.
	 * @returns The entry.
	 */
	private toEntry(folder: DesktopFolder, item: FileItem): FolderEntry {
		const inside = item.path.replace(/^\/+/, "").replace(/\/+$/, "");
		return {
			path: inside ? `${folder.name}/${inside}` : folder.name,
			name: item.name,
			kind: item.type === "directory" ? "directory" : "file",
			size: typeof item.size === "number" ? item.size : undefined,
			modified: item.lastModified,
		};
	}
}
