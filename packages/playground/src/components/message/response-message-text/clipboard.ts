export const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "Unable to copy content";
};

export const copyToClipboard = async (
	value: string,
	onSuccess: () => void,
	onError: (message: string) => void,
) => {
	try {
		await navigator.clipboard.writeText(value);
		onSuccess();
	} catch (error) {
		onError(getErrorMessage(error));
	}
};

/**
 * Returns the comment syntax for a given language
 * Used for separating multiple code blocks in "Copy All Code" feature
 */
export const getCommentSyntax = (language: string): string => {
	const commentMap: Record<string, string> = {
		// C-style comments
		javascript: "//",
		typescript: "//",
		js: "//",
		ts: "//",
		java: "//",
		cpp: "//",
		c: "//",
		cs: "//",
		csharp: "//",
		go: "//",
		rust: "//",
		rs: "//",
		kotlin: "//",
		kt: "//",
		swift: "//",
		jsx: "//",
		tsx: "//",
		scala: "//",
		groovy: "//",
		php: "//",
		// Hash comments
		python: "#",
		py: "#",
		ruby: "#",
		rb: "#",
		sh: "#",
		bash: "#",
		yaml: "#",
		yml: "#",
		r: "#",
		perl: "#",
		// SQL comment
		sql: "--",
		// HTML/XML comment
		html: "<!--",
		xml: "<!--",
		// CSS comment
		css: "/*",
		scss: "/*",
		less: "/*",
		// Lua comment
		lua: "--",
		// Haskell comment
		haskell: "--",
		hs: "--",
	};

	return commentMap[language.toLowerCase()] || "//";
};

/**
 * Downloads content as a file with the given filename
 * Creates a temporary download link and triggers it
 */
export const downloadAsFile = (content: string, filename: string): void => {
	const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/**
 * Prompts user for filename and downloads content with correct extension
 * Extension is locked to match the file type and cannot be changed by user
 *
 * @param content - Content to download
 * @param extension - File extension (without dot, e.g., "js", "html")
 * @param defaultBaseName - Default filename without extension (default: "code")
 * @param onSuccess - Callback on successful download
 */
export const downloadWithPrompt = (
	content: string,
	extension: string,
	defaultBaseName: string = "code",
	onSuccess: (filename: string) => void,
): void => {
	const userInput = prompt(
		`Enter filename (extension .${extension} will be added automatically):`,
		defaultBaseName,
	);

	if (userInput) {
		// Strip any extension the user might have typed
		const cleanBaseName = userInput.includes(".")
			? userInput.substring(0, userInput.lastIndexOf("."))
			: userInput;

		// Always use the correct extension
		const filename = `${cleanBaseName}.${extension}`;

		downloadAsFile(content, filename);
		onSuccess(filename);
	}
};
