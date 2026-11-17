import type { FileItem, FileSource } from "@semoss/shared";

/** A file source kept in memory, its files by path from its root. */
export interface MemoryFileSource extends FileSource {
	/** Its files' text, by path such as `/notes/a.md`. */
	readonly files: Map<string, string>;
	/** Its folders, by path such as `/notes`. */
	readonly directories: Set<string>;
}

/**
 * A source over files kept in memory, standing in for a folder on the user's
 * machine. Paths are as the explorer has them: `/` is the root.
 *
 * @param files - Its files' text, by path.
 * @returns The source.
 */
export const createMemoryFileSource = (
	files: Record<string, string> = {},
): MemoryFileSource => {
	const fileMap = new Map(Object.entries(files));
	const directories = new Set<string>(["/"]);
	const clean = (path: string) => `/${path.replace(/^\/+|\/+$/g, "")}`;
	const parentOf = (path: string) =>
		clean(path).split("/").slice(0, -1).join("/") || "/";
	const addParents = (path: string) => {
		let parent = parentOf(path);
		while (parent !== "/") {
			directories.add(parent);
			parent = parentOf(parent);
		}
	};
	for (const path of fileMap.keys()) {
		addParents(path);
	}
	const nameOf = (path: string) => clean(path).split("/").pop() ?? "";

	return {
		files: fileMap,
		directories: directories,
		capabilities: {
			search: false,
			mutate: true,
			upload: true,
			download: false,
			delete: true,
		},
		list: async (path) => {
			const directory = clean(path);
			if (!directories.has(directory)) {
				throw new Error(`No folder at ${directory}`);
			}
			const items: FileItem[] = [];
			for (const candidate of directories) {
				if (candidate !== "/" && parentOf(candidate) === directory) {
					items.push({
						name: nameOf(candidate),
						path: candidate,
						type: "directory",
					});
				}
			}
			for (const [file, text] of fileMap) {
				if (parentOf(file) === directory) {
					items.push({
						name: nameOf(file),
						path: file,
						size: text.length,
					});
				}
			}
			return items;
		},
		read: async (path) => {
			const text = fileMap.get(clean(path));
			if (text === undefined) {
				throw new Error(`No file at ${clean(path)}`);
			}
			return new TextEncoder().encode(text);
		},
		write: async (path, bytes) => {
			fileMap.set(clean(path), new TextDecoder().decode(bytes));
			addParents(path);
		},
		move: async (from, to) => {
			const text = fileMap.get(clean(from));
			if (text === undefined) {
				throw new Error(`No file at ${clean(from)}`);
			}
			fileMap.delete(clean(from));
			fileMap.set(clean(to), text);
			addParents(to);
		},
		copy: async (from, to) => {
			fileMap.set(clean(to), fileMap.get(clean(from)) ?? "");
		},
		remove: async (path) => {
			fileMap.delete(clean(path));
			directories.delete(clean(path));
		},
		createFile: async (path) => {
			fileMap.set(clean(path), "");
			addParents(path);
		},
		createDirectory: async (path) => {
			directories.add(clean(path));
			addParents(path);
		},
	};
};
