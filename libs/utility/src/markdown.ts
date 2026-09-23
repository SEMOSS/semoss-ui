const MARKDOWN_PATTERNS = [
	/^#{1,6}\s/m,
	/\|.+\|.+\|/m,
	/^[-*+]\s/m,
	/^\d+\.\s/m,
	/```[\s\S]*?```/,
	/\*\*.+?\*\*/,
	/\[.+?\]\(.+?\)/,
];

/** Detect Markdown syntax substantial enough to render as Markdown. */
export const looksLikeMarkdown = (text: string): boolean => {
	if (!text || text.length < 4) return false;
	return MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));
};

/** Detect complete HTML documents while leaving HTML fragments as text. */
export const looksLikeHtmlDocument = (text: string): boolean =>
	/^\s*(?:<!doctype\s+html\s*>|<html(?:\s|>))/i.test(text);

/** Decode a quoted or escaped string before Markdown rendering. */
export const normalizeForMarkdown = (text: string): string => {
	let normalized = text;
	if (normalized.startsWith('"') && normalized.endsWith('"')) {
		try {
			const parsed: unknown = JSON.parse(normalized);
			if (typeof parsed === "string") normalized = parsed;
		} catch {
			normalized = normalized.slice(1, -1);
		}
	}
	return normalized.includes("\\n")
		? normalized.replace(/\\n/g, "\n")
		: normalized;
};

/** Split log messages into lines, removing one trailing newline per message. */
export const splitMessageLines = (messages: string[]): string[] =>
	messages.flatMap((message) => message.replace(/\n$/, "").split("\n"));

/** Count non-empty logical lines while ignoring one trailing newline. */
export const countLines = (text: string): number => {
	if (!text) return 0;
	const trimmed = text.endsWith("\n") ? text.slice(0, -1) : text;
	return trimmed ? trimmed.split("\n").length : 0;
};

/** Format UTF-8 text size for compact output metadata. */
export const formatBytes = (text: string): string => {
	const bytes = new Blob([text || ""]).size;
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
