/** File kinds with dedicated workbench panel types. */
export type FileEditorKind =
	| "code"
	| "download"
	| "image"
	| "markdown"
	| "notebook"
	| "pdf";

const IMAGE_EXTENSIONS = new Set([
	"bmp",
	"gif",
	"jpeg",
	"jpg",
	"png",
	"svg",
	"webp",
]);

const DOWNLOAD_ONLY_EXTENSIONS = new Set([
	"doc",
	"docx",
	"ppt",
	"pptx",
	"xls",
	"xlsx",
]);

/**
 * Resolve the dedicated workbench panel kind for a file path.
 *
 * HTML and unsupported extensions intentionally use the code panel.
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

	if (extension === "md" || extension === "markdown") {
		return "markdown";
	}

	if (extension === "ipynb") {
		return "notebook";
	}

	return "code";
};
