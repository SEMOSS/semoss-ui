import {
	type CodeEditorMenuItem,
	DEFAULT_CODE_EDITOR_MENU_ITEMS,
} from "@semoss/ui/next";
import { getImageMimeType as getMimeType } from "@semoss/utility/image";
import { FILE_PANEL_TYPES } from "../constants/file-panel.constants";

const CODE_EDITOR_LANGUAGES: Record<string, string> = {
	bash: "shell",
	css: "css",
	csv: "plaintext",
	html: "html",
	ipynb: "json",
	java: "java",
	js: "javascript",
	json: "json",
	jsx: "javascript",
	markdown: "markdown",
	md: "markdown",
	py: "python",
	sh: "shell",
	ts: "typescript",
	tsx: "typescript",
	tsv: "plaintext",
	txt: "plaintext",
	xml: "xml",
	yaml: "yaml",
	yml: "yaml",
};

const READ_ONLY_CODE_EDITOR_MENU_ITEMS = DEFAULT_CODE_EDITOR_MENU_ITEMS.filter(
	(item) => item.id === "copy" || item.id === "find",
);

const IMAGE_EXTENSIONS = new Set([
	"bmp",
	"gif",
	"jpeg",
	"jpg",
	"png",
	"svg",
	"webp",
]);

const DOWNLOAD_ONLY_EXTENSIONS = new Set(["doc", "ppt", "xls"]);

const FILE_PANEL_TYPES_BY_EXTENSION: Record<string, string> = {
	docx: FILE_PANEL_TYPES.FILE_DOCX_VIEWER,
	ipynb: FILE_PANEL_TYPES.FILE_NOTEBOOK_EDITOR,
	markdown: FILE_PANEL_TYPES.FILE_MARKDOWN_EDITOR,
	md: FILE_PANEL_TYPES.FILE_MARKDOWN_EDITOR,
	pdf: FILE_PANEL_TYPES.FILE_PDF_VIEWER,
	pptx: FILE_PANEL_TYPES.FILE_PPTX_VIEWER,
	vsdx: FILE_PANEL_TYPES.FILE_VISIO_VIEWER,
	xlsx: FILE_PANEL_TYPES.FILE_XLSX_VIEWER,
};

interface GetFileCodeEditorMenuItemsOptions {
	canSave: boolean;
	isBusy: boolean;
	onDownload: () => void;
	onRefresh: () => void;
	onSave?: () => void;
}

/** Build file actions and standard editing actions for one CodeEditor. */
export const getFileCodeEditorMenuItems = ({
	canSave,
	isBusy,
	onDownload,
	onRefresh,
	onSave,
}: GetFileCodeEditorMenuItemsOptions): CodeEditorMenuItem[] => {
	const editorItems = canSave
		? DEFAULT_CODE_EDITOR_MENU_ITEMS
		: READ_ONLY_CODE_EDITOR_MENU_ITEMS;

	return [
		{
			id: "refresh-file",
			label: "Refresh",
			shortcut: "⌘ + R",
			disabled: isBusy,
			keybindings: (monacoInstance) => [
				monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyR,
			],
			onSelect: onRefresh,
		},
		...(canSave && onSave
			? [
					{
						id: "save-file",
						label: "Save",
						shortcut: "⌘ + S",
						disabled: isBusy,
						keybindings: (monacoInstance) => [
							monacoInstance.KeyMod.CtrlCmd |
								monacoInstance.KeyCode.KeyS,
						],
						onSelect: onSave,
					} satisfies CodeEditorMenuItem,
				]
			: []),
		{
			id: "download-file",
			label: "Download",
			disabled: isBusy,
			onSelect: onDownload,
			separator: true,
		},
		...editorItems,
	];
};

/** Infer the Monaco language id from a file path. */
export const getCodeEditorLanguage = (path: string): string => {
	const extension = path.split(".").pop()?.toLowerCase() ?? "";
	return CODE_EDITOR_LANGUAGES[extension] ?? "plaintext";
};

/** Infer an image MIME type from a file path. */
export const getImageMimeType = (path: string): string => {
	const extension = path.split(".").pop()?.toLowerCase() ?? "";
	return getMimeType(extension);
};

/** Resolve a file path to its unified workbench panel type. */
export const getFilePanelType = (path: string): string => {
	const extension = path.split(".").pop()?.toLowerCase() ?? "";

	if (DOWNLOAD_ONLY_EXTENSIONS.has(extension)) {
		return FILE_PANEL_TYPES.FILE_DOWNLOAD;
	}

	if (IMAGE_EXTENSIONS.has(extension)) {
		return FILE_PANEL_TYPES.FILE_IMAGE_VIEWER;
	}

	return (
		FILE_PANEL_TYPES_BY_EXTENSION[extension] ??
		FILE_PANEL_TYPES.FILE_CODE_EDITOR
	);
};
