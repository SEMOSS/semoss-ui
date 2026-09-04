import {
	type CodeEditorMenuItem,
	DEFAULT_CODE_EDITOR_MENU_ITEMS,
} from "@semoss/ui/next";

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

const IMAGE_MIME_TYPES: Record<string, string> = {
	bmp: "image/bmp",
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml",
	webp: "image/webp",
};

const READ_ONLY_CODE_EDITOR_MENU_ITEMS = DEFAULT_CODE_EDITOR_MENU_ITEMS.filter(
	(item) => item.id === "copy" || item.id === "find",
);

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
	return IMAGE_MIME_TYPES[extension] ?? "image/png";
};
