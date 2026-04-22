import type { FileItem } from "./file.types";

interface StoragePathEntry {
	Name?: string;
	name?: string;
	Path?: string;
	path?: string;
	IsDir?: boolean;
	isDir?: boolean;
	ModTime?: string;
	lastModified?: string;
	last_modified?: string;
}

export const isEditableElement = (target: EventTarget | null): boolean => {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	return (
		target.isContentEditable ||
		target.tagName === "INPUT" ||
		target.tagName === "TEXTAREA" ||
		target.tagName === "SELECT"
	);
};

export const mapStorageEntriesToFileItems = (entries: unknown): FileItem[] => {
	if (!Array.isArray(entries)) {
		return [];
	}

	return entries.reduce<FileItem[]>((acc, entry) => {
		if (typeof entry === "string") {
			if (!entry) {
				return acc;
			}

			const normalizedEntry = entry.replace(/\/+$/, "");
			const name =
				normalizedEntry.split("/").filter(Boolean).pop() ||
				normalizedEntry;
			const isDirectory = entry.endsWith("/");

			acc.push({
				name: name,
				path: entry,
				type: isDirectory ? "directory" : undefined,
			});

			return acc;
		}

		if (!entry || typeof entry !== "object") {
			return acc;
		}

		const details = entry as StoragePathEntry;
		const name = details.Name || details.name || "";
		const path = details.Path || details.path || "";
		if (!path) {
			return acc;
		}
		const fallbackName = path.split("/").filter(Boolean).pop() || "/";
		const isDirectory = details.IsDir || details.isDir;

		acc.push({
			name: name || fallbackName,
			path: path,
			type: isDirectory ? "directory" : undefined,
			lastModified:
				details.ModTime ||
				details.lastModified ||
				details.last_modified,
		});

		return acc;
	}, []);
};

export const normalizeFolderPath = (value: string): string => {
	const trimmed = value.trim();
	if (!trimmed || trimmed === "/") {
		return "/";
	}

	return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
};
