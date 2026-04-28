import {
	FileArchiveIcon,
	FileBadgeIcon,
	FileChartPieIcon,
	FileClockIcon,
	FileCode2Icon,
	FileCodeIcon,
	FileCogIcon,
	FileDiffIcon,
	FileDigitIcon,
	FileIcon,
	FileImageIcon,
	FileJsonIcon,
	FileKeyIcon,
	FileLockIcon,
	FileMusicIcon,
	FileSpreadsheetIcon,
	FileTerminalIcon,
	FileTextIcon,
	FileTypeIcon,
	FileVideoIcon,
	type LucideIcon,
} from "lucide-react";
import type { FileItem } from "./file.types";

export const FILE_EXPLORER_DRAG_DATA_TYPE =
	"application/x-semoss-file-explorer-items";

const FILE_ICON_RULES: {
	extensions: readonly string[];
	Icon: LucideIcon;
}[] = [
	// Images (checked first so svg/ico are caught here before other rules)
	{
		extensions: [
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"svg",
			"bmp",
			"ico",
			"tiff",
			"tif",
			"img",
			"psd",
			"ai",
			"avif",
			"heic",
			"heif",
		],
		Icon: FileImageIcon,
	},
	// PDF
	{ extensions: ["pdf"], Icon: FileBadgeIcon },
	// Spreadsheets
	{
		extensions: ["xls", "xlsx", "csv", "ods", "tsv", "numbers"],
		Icon: FileSpreadsheetIcon,
	},
	// Source code
	{
		extensions: [
			// JS / TS
			"js",
			"mjs",
			"cjs",
			"jsx",
			"ts",
			"tsx",
			"mts",
			"cts",
			// Python
			"py",
			"pyw",
			"pyi",
			// JVM
			"java",
			"kt",
			"kts",
			"scala",
			"groovy",
			"clj",
			"cljs",
			// Systems
			"c",
			"h",
			"cpp",
			"hpp",
			"cc",
			"cxx",
			"cs",
			"go",
			"rs",
			"zig",
			// Scripting / dynamic
			"rb",
			"php",
			"lua",
			"pl",
			"pm",
			"r",
			"jl",
			"dart",
			// Functional
			"hs",
			"elm",
			"ml",
			"mli",
			"fs",
			"fsx",
			"ex",
			"exs",
			"erl",
			"hrl",
			// Mobile / other
			"swift",
			"m",
			"mm",
			"vb",
			"pas",
			"d",
			"nim",
			"sol",
			"graphql",
			"gql",
		],
		Icon: FileCodeIcon,
	},
	// Shell / scripts
	{
		extensions: [
			"sh",
			"bash",
			"zsh",
			"bat",
			"ps1",
			"cmd",
			"fish",
			"nu",
			"pwsh",
		],
		Icon: FileTerminalIcon,
	},
	// JSON
	{ extensions: ["json", "jsonc", "json5", "geojson"], Icon: FileJsonIcon },
	// Config / settings (yaml, toml, env, dotfiles, xml-based)
	{
		extensions: [
			"yaml",
			"yml",
			"toml",
			"ini",
			"cfg",
			"conf",
			"env",
			"properties",
			"xml",
			"plist",
			"xsd",
			"xslt",
			"wsdl",
			"gitignore",
			"gitattributes",
			"gitmodules",
			"npmrc",
			"nvmrc",
			"yarnrc",
			"babelrc",
			"eslintrc",
			"prettierrc",
			"stylelintrc",
			"dockerignore",
			"htaccess",
			"browserslistrc",
			"editorconfig",
		],
		Icon: FileCogIcon,
	},
	// Archives
	{
		extensions: [
			"zip",
			"tar",
			"gz",
			"rar",
			"7z",
			"bz2",
			"xz",
			"tgz",
			"dmg",
			"iso",
			"pkg",
			"deb",
			"rpm",
		],
		Icon: FileArchiveIcon,
	},
	// Presentations
	{ extensions: ["ppt", "pptx", "odp", "key"], Icon: FileChartPieIcon },
	// Audio
	{
		extensions: [
			"mp3",
			"wav",
			"ogg",
			"flac",
			"aac",
			"m4a",
			"wma",
			"opus",
			"mid",
			"midi",
		],
		Icon: FileMusicIcon,
	},
	// Video
	{
		extensions: [
			"mp4",
			"mov",
			"avi",
			"mkv",
			"webm",
			"m4v",
			"wmv",
			"flv",
			"ogv",
			"vob",
		],
		Icon: FileVideoIcon,
	},
	// Web markup & styling
	{
		extensions: [
			"html",
			"htm",
			"hbs",
			"ejs",
			"pug",
			"jade",
			"haml",
			"twig",
			"liquid",
			"mustache",
			"css",
			"scss",
			"sass",
			"less",
			"styl",
		],
		Icon: FileTypeIcon,
	},
	// Prose, docs & plain text
	{
		extensions: [
			"md",
			"mdx",
			"txt",
			"rst",
			"adoc",
			"rtf",
			"doc",
			"docx",
			"odt",
			"pages",
			"msg",
			"tex",
		],
		Icon: FileTextIcon,
	},
	// Notebooks
	{ extensions: ["ipynb"], Icon: FileCode2Icon },
	// Database & SQL
	{ extensions: ["sql", "sqlite", "sqlite3", "db"], Icon: FileDigitIcon },
	// Certificates & keys
	{
		extensions: ["pem", "crt", "cer", "key", "p12", "pfx", "pub", "asc"],
		Icon: FileKeyIcon,
	},
	// Lock files
	{ extensions: ["lock"], Icon: FileLockIcon },
	// Diffs & patches
	{ extensions: ["diff", "patch"], Icon: FileDiffIcon },
	// Logs
	{ extensions: ["log"], Icon: FileClockIcon },
	// Fonts
	{ extensions: ["ttf", "otf", "woff", "woff2", "eot"], Icon: FileTypeIcon },
];

export const getFileIconComponent = (fileName: string): LucideIcon => {
	const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

	return (
		FILE_ICON_RULES.find(({ extensions }) => extensions.includes(extension))
			?.Icon ?? FileIcon
	);
};

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

const truncateErrorDetail = (message: string) => {
	const normalizedMessage = message.trim();
	if (normalizedMessage.length <= 300) {
		return normalizedMessage;
	}

	return `${normalizedMessage.slice(0, 297)}...`;
};

const getStringDetail = (value: unknown): string | null => {
	if (typeof value === "string" && value.trim()) {
		return value;
	}

	if (value instanceof Error && value.message.trim()) {
		return value.message;
	}

	return null;
};

export const getFileErrorDetail = (error: unknown): string | null => {
	const stringDetail = getStringDetail(error);
	if (stringDetail) {
		return truncateErrorDetail(stringDetail);
	}

	if (!error || typeof error !== "object") {
		return null;
	}

	const errorRecord = error as Record<string, unknown>;
	const directDetail =
		getStringDetail(errorRecord.message) ||
		getStringDetail(errorRecord.error) ||
		getStringDetail(errorRecord.output);
	if (directDetail) {
		return truncateErrorDetail(directDetail);
	}

	const errors = errorRecord.errors;
	if (Array.isArray(errors)) {
		const errorDetails = errors
			.map((entry) => getStringDetail(entry))
			.filter((entry): entry is string => Boolean(entry));
		if (errorDetails.length > 0) {
			return truncateErrorDetail(errorDetails.join(", "));
		}
	}

	const pixelReturn = errorRecord.pixelReturn;
	if (Array.isArray(pixelReturn)) {
		const pixelErrorDetails = pixelReturn
			.map((entry) => {
				if (!entry || typeof entry !== "object") {
					return null;
				}

				const pixelEntry = entry as Record<string, unknown>;
				const operationType = pixelEntry.operationType;
				const hasErrorOperation =
					Array.isArray(operationType) &&
					operationType.some((type) => type === "ERROR");

				return hasErrorOperation
					? getStringDetail(pixelEntry.output)
					: null;
			})
			.filter((entry): entry is string => Boolean(entry));

		if (pixelErrorDetails.length > 0) {
			return truncateErrorDetail(pixelErrorDetails.join(", "));
		}
	}

	return null;
};

export const getFileOperationErrorMessage = (
	fallbackMessage: string,
	error: unknown,
) => {
	const detail = getFileErrorDetail(error);
	if (!detail) {
		return fallbackMessage;
	}

	return `${fallbackMessage}: ${detail}`;
};
