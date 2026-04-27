import type { FileItem } from "./file.types";

export const FILE_EXPLORER_DRAG_DATA_TYPE =
	"application/x-semoss-file-explorer-items";

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

export const normalizeAssetPath = (assetPath: string) =>
	assetPath.replace(/\/+$/, "") || "/";

export const ensureDirectoryPath = (assetPath: string) =>
	assetPath.endsWith("/") ? assetPath : `${assetPath}/`;

export const getItemName = (item: FileItem) =>
	item.path.split("/").filter(Boolean).pop() || item.name;

export const getFileExplorerTestIdSegment = (value: string) =>
	(value || "root")
		.replace(/^\//, "root-")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase() || "root";

export const getParentPath = (assetPath: string) => {
	const normalizedPath = normalizeAssetPath(assetPath);
	const slashIndex = normalizedPath.lastIndexOf("/");
	return slashIndex <= 0 ? "/" : `${normalizedPath.slice(0, slashIndex)}/`;
};

export const getItemTargetDirectory = (item: FileItem) => {
	if (item.type === "directory") {
		return ensureDirectoryPath(item.path);
	}

	return getParentPath(item.path);
};

export const canMoveItemToDirectory = (
	item: FileItem,
	targetDirectory: string,
) => {
	const normalizedItemPath = normalizeAssetPath(item.path);
	const normalizedTargetDirectory = ensureDirectoryPath(targetDirectory);
	const normalizedTargetPath = normalizeAssetPath(normalizedTargetDirectory);
	const normalizedDestinationPath = normalizeAssetPath(
		`${normalizedTargetDirectory}${getItemName(item)}`,
	);

	if (
		normalizedItemPath === normalizedTargetPath ||
		normalizedItemPath === normalizedDestinationPath
	) {
		return false;
	}

	return !(
		item.type === "directory" &&
		normalizedTargetPath.startsWith(`${normalizedItemPath}/`)
	);
};

export const parseExplorerDragItems = (
	dataTransfer: DataTransfer,
): FileItem[] => {
	const payload = dataTransfer.getData(FILE_EXPLORER_DRAG_DATA_TYPE);
	if (!payload) return [];

	try {
		const parsed = JSON.parse(payload) as FileItem[];
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((draggedItem): draggedItem is FileItem =>
			Boolean(
				draggedItem &&
					typeof draggedItem.name === "string" &&
					typeof draggedItem.path === "string",
			),
		);
	} catch (_e) {
		return [];
	}
};

export const isExplorerDrag = (dataTransfer: DataTransfer) =>
	Array.from(dataTransfer.types).includes(FILE_EXPLORER_DRAG_DATA_TYPE);

export const isPointerOutsideElement = (
	element: HTMLElement,
	clientX: number,
	clientY: number,
) => {
	const rect = element.getBoundingClientRect();
	return (
		clientX <= rect.left ||
		clientX >= rect.right ||
		clientY <= rect.top ||
		clientY >= rect.bottom
	);
};
