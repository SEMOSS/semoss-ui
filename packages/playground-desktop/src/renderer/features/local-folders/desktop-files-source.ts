import { getI18n } from "@semoss/i18n";
import type { FileItem } from "@semoss/shared";
import type { FolderSource } from "./local-folders-host";

/**
 * The mount the Desktop tree in a room's Files is registered under. A file
 * panel opened from it has the mode `{ type: "MOUNT", mountId: "desktop" }`
 * and a path that starts with its folder's name.
 */
export const DESKTOP_MOUNT_ID = "desktop";

/** One attached folder, as the Desktop tree shows it. */
export interface DesktopFilesFolder {
	/** The attachment's id. */
	id: string;
	/** Its name: the top level entry its files are under. */
	name: string;
	/** Where its files are read and written. */
	source: FolderSource;
}

/** Where a Desktop path is: which folder, and the path inside it. */
export interface DesktopFilesLocation {
	folderId: string;
	/** The path in the folder's own source; `/` is the folder itself. */
	path: string;
}

/** The attached folders as one tree, each folder a top level directory. */
export interface DesktopFilesSource extends FolderSource {
	/**
	 * Which folder a path is in.
	 *
	 * @param path - A path in the Desktop tree.
	 * @returns The folder and the path inside it, or null for the top level
	 * or a folder that is not attached.
	 */
	locate(path: string): DesktopFilesLocation | null;
	/**
	 * A folder's path, as the Desktop tree has it.
	 *
	 * @param folderId - The attachment.
	 * @param path - A path inside the folder.
	 * @returns The path in the Desktop tree, or null for a folder that is not
	 * attached.
	 */
	toDesktopPath(folderId: string, path: string): string | null;
}

/**
 * The attached folders as one tree for a room's Files: its top level lists
 * the folders, and everything under a folder is read and written through
 * that folder's own source. Nothing can be written at the top level, and a
 * file moves or copies only within its own folder.
 *
 * @param folders - The attached folders, each with a unique name.
 * @returns The source. Make one per set of folders, so its identity holds.
 */
export const createDesktopFilesSource = (
	folders: readonly DesktopFilesFolder[],
): DesktopFilesSource => {
	const { t } = getI18n();

	/**
	 * The folder a path is in, by its first segment.
	 *
	 * @param path - A Desktop path.
	 * @returns The folder and its source path, or null.
	 */
	const find = (
		path: string,
	): { folder: DesktopFilesFolder; path: string } | null => {
		const [name, ...rest] = path.split("/").filter(Boolean);
		const folder = folders.find((candidate) => candidate.name === name);
		if (!folder) {
			return null;
		}
		const inner = `/${rest.join("/")}`;
		return {
			folder: folder,
			path: path.endsWith("/") && rest.length > 0 ? `${inner}/` : inner,
		};
	};

	/**
	 * Like {@link find}, for a path that has to be inside a folder: the top
	 * level and the folders themselves cannot be written.
	 *
	 * @param path - A Desktop path.
	 * @returns The folder and its source path.
	 * @throws Error for anything outside a folder.
	 */
	const inside = (
		path: string,
	): { folder: DesktopFilesFolder; path: string } => {
		const found = find(path);
		if (!found || found.path === "/") {
			throw new Error(t("desktop:localFolders.notInFolder"));
		}
		return found;
	};

	/**
	 * A folder's item, as the Desktop tree has it.
	 *
	 * @param folder - The folder it is in.
	 * @param item - The item, as the folder's source has it.
	 * @returns The item under the folder's name.
	 */
	const toItem = (folder: DesktopFilesFolder, item: FileItem): FileItem => ({
		...item,
		path: `/${folder.name}${item.path}`,
	});

	/**
	 * Two paths in one folder, for a move or a copy.
	 *
	 * @param from - Where the item is.
	 * @param to - Where it goes.
	 * @returns The folder and both of its paths.
	 * @throws Error when they are in different folders.
	 */
	const pair = (from: string, to: string) => {
		const source = inside(from);
		const target = inside(to);
		if (source.folder !== target.folder) {
			throw new Error(t("desktop:localFolders.betweenFolders"));
		}
		return { folder: source.folder, from: source.path, to: target.path };
	};

	const all = folders.map((folder) => folder.source.capabilities);
	// whether the last search left matches out in any folder it searched
	let isSearchTruncated = false;

	return {
		get isSearchTruncated() {
			return isSearchTruncated;
		},
		capabilities: {
			search: all.length > 0 && all.every((own) => own.search),
			mutate: all.some((own) => own.mutate),
			upload: all.some((own) => own.upload),
			download: all.some((own) => own.download),
			delete: all.some((own) => own.delete),
		},
		list: async (path) => {
			const found = find(path);
			if (!found) {
				return folders.map((folder) => ({
					name: folder.name,
					path: `/${folder.name}/`,
					type: "directory" as const,
				}));
			}
			const items = await found.folder.source.list(found.path);
			return items.map((item) => toItem(found.folder, item));
		},
		stat: async (path) => {
			const found = find(path);
			if (!found) {
				return null;
			}
			if (found.path === "/") {
				return {
					name: found.folder.name,
					path: `/${found.folder.name}/`,
					type: "directory",
				};
			}
			const item = await found.folder.source.stat?.(found.path);
			return item ? toItem(found.folder, item) : null;
		},
		search: async (path, term) => {
			const found = find(path);
			const searched = found
				? [found]
				: folders.map((folder) => ({ folder, path: "/" }));
			const results = await Promise.all(
				searched.map(async ({ folder, path: inner }) =>
					((await folder.source.search?.(inner, term)) ?? []).map(
						(item) => toItem(folder, item),
					),
				),
			);
			isSearchTruncated = searched.some(
				({ folder }) => folder.source.isSearchTruncated === true,
			);
			return results.flat();
		},
		read: async (path) => {
			const found = inside(path);
			return found.folder.source.read(found.path);
		},
		write: async (path, bytes) => {
			const found = inside(path);
			return found.folder.source.write(found.path, bytes);
		},
		move: async (oldPath, newPath) => {
			const moved = pair(oldPath, newPath);
			return moved.folder.source.move(moved.from, moved.to);
		},
		copy: async (oldPath, newPath) => {
			const copied = pair(oldPath, newPath);
			return copied.folder.source.copy(copied.from, copied.to);
		},
		remove: async (path) => {
			const found = inside(path);
			return found.folder.source.remove(found.path);
		},
		createFile: async (path) => {
			const found = inside(path);
			return found.folder.source.createFile(found.path);
		},
		createDirectory: async (path) => {
			const found = inside(path);
			return found.folder.source.createDirectory(found.path);
		},
		upload: async (path, files) => {
			const found = find(path);
			if (!found?.folder.source.upload) {
				throw new Error(t("desktop:localFolders.notInFolder"));
			}
			await found.folder.source.upload(found.path, files);
		},
		locate: (path) => {
			const found = find(path);
			return found
				? { folderId: found.folder.id, path: found.path }
				: null;
		},
		toDesktopPath: (folderId, path) => {
			const folder = folders.find(
				(candidate) => candidate.id === folderId,
			);
			return folder ? `/${folder.name}${path}` : null;
		},
	};
};
