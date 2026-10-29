/** File kinds with dedicated workbench panel types. */
export type FileEditorKind =
	| "code"
	| "download"
	| "image"
	| "markdown"
	| "notebook"
	| "pdf"
	| "pptx";

const IMAGE_EXTENSIONS = new Set([
	"bmp",
	"gif",
	"jpeg",
	"jpg",
	"png",
	"svg",
	"webp",
]);

// Office files and binaries no panel previews; the code panel would show them as garbage
const DOWNLOAD_ONLY_EXTENSIONS = new Set([
	"7z",
	"avi",
	"dmg",
	"doc",
	"docm",
	"docx",
	"exe",
	"gz",
	"heic",
	"iso",
	"jar",
	"m4a",
	"mov",
	"mp3",
	"mp4",
	"msg",
	"odp",
	"ods",
	"odt",
	"ppt",
	"pptm",
	"psd",
	"rar",
	"tar",
	"tgz",
	"tif",
	"tiff",
	"vsdx",
	"wav",
	"webm",
	"xls",
	"xlsb",
	"xlsm",
	"xlsx",
	"zip",
]);

/**
 * Resolve the dedicated workbench panel kind for a file path.
 *
 * HTML and other text extensions intentionally use the code panel.
 *
 * @param path - File path to classify.
 * @returns The file's workbench editor kind.
 */
export const getFileEditorKind = (path: string): FileEditorKind => {
	const extension = path.split(".").pop()?.toLowerCase() ?? "";

	if (DOWNLOAD_ONLY_EXTENSIONS.has(extension)) {
		return "download";
	}

	if (IMAGE_EXTENSIONS.has(extension)) {
		return "image";
	}

	if (extension === "pdf") {
		return "pdf";
	}

	if (extension === "pptx") {
		return "pptx";
	}

	if (extension === "md" || extension === "markdown") {
		return "markdown";
	}

	if (extension === "ipynb") {
		return "notebook";
	}

	return "code";
};
