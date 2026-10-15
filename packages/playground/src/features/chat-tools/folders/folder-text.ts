import { getFileExtension } from "@semoss/utility/file";
import { countOccurrences } from "@semoss/utility/text";

/**
 * Extensions that are binary however their first bytes look. Office files and
 * PDFs are zip or binary containers the model cannot read as text; they reach
 * the model by being attached to a message instead.
 */
const BINARY_EXTENSIONS = new Set([
	"7z",
	"avi",
	"bmp",
	"dmg",
	"doc",
	"docx",
	"exe",
	"gif",
	"gz",
	"heic",
	"ico",
	"jar",
	"jpeg",
	"jpg",
	"key",
	"m4a",
	"mov",
	"mp3",
	"mp4",
	"numbers",
	"odp",
	"ods",
	"odt",
	"pages",
	"pdf",
	"png",
	"ppt",
	"pptx",
	"rar",
	"tar",
	"tgz",
	"tif",
	"tiff",
	"wav",
	"webm",
	"webp",
	"xls",
	"xlsx",
	"zip",
]);

/** How much of a file is sniffed for NUL bytes before decoding it as text. */
const SNIFF_BYTES = 8192;

/**
 * A request the work folder tools refuse for a reason the model can act on,
 * such as an edit whose text does not match. Its message is the tool result.
 */
export class FolderToolError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FolderToolError";
	}
}

/**
 * Whether a file is binary by its name alone.
 *
 * @param name - A file name or path.
 * @return True for images, media, archives, PDFs, and Office documents.
 */
export const isBinaryFileName = (name: string): boolean =>
	BINARY_EXTENSIONS.has(getFileExtension(name));

/**
 * Decode a file's bytes as UTF-8 text, or resolve to null when the bytes are
 * not text. A NUL byte early in the file, or bytes that are not valid UTF-8,
 * mark it as binary.
 *
 * @param bytes - The file's contents.
 * @param isPartial - The bytes are only the start of the file, so the last
 * character may be cut in half. Invalid bytes are then replaced rather than
 * marking the file as binary.
 * @return The text, or null for binary content.
 */
export const decodeTextFile = (
	bytes: Uint8Array,
	isPartial = false,
): string | null => {
	const sniff = bytes.subarray(0, SNIFF_BYTES);
	for (let index = 0; index < sniff.length; index++) {
		if (sniff[index] === 0) {
			return null;
		}
	}

	try {
		return new TextDecoder("utf-8", { fatal: !isPartial }).decode(bytes);
	} catch {
		return null;
	}
};

/** A window of lines read from a text file. */
export interface TextFileSlice {
	/** The lines in the window, joined with the file's own line breaks. */
	content: string;
	/** Number of lines in the whole file. */
	totalLines: number;
	/** First line in the window, counting from 1. */
	startLine: number;
	/** Last line in the window, counting from 1. */
	endLine: number;
	/** Whether the file continues past the window. */
	truncated: boolean;
}

/**
 * Cut a window of lines out of a text file, bounded by a line count and a
 * character budget, whichever runs out first.
 *
 * @param text - The whole file.
 * @param offset - First line to include, counting from 1.
 * @param limit - Most lines to include.
 * @param maxChars - Most characters to include.
 * @return The window and where it sits in the file.
 * @throws FolderToolError when `offset` is past the end of the file.
 */
export const sliceTextLines = (
	text: string,
	offset: number,
	limit: number,
	maxChars: number,
): TextFileSlice => {
	const lines = text.split(/(?<=\n)/);
	const totalLines = lines.length === 1 && lines[0] === "" ? 0 : lines.length;
	const startIndex = Math.max(0, offset - 1);

	if (totalLines === 0) {
		return {
			content: "",
			totalLines: 0,
			startLine: 0,
			endLine: 0,
			truncated: false,
		};
	}
	if (startIndex >= totalLines) {
		throw new FolderToolError(
			`The file has ${totalLines} lines, so there is nothing at line ${offset}.`,
		);
	}

	let content = "";
	let endIndex = startIndex;
	let isLineCut = false;
	while (endIndex < totalLines && endIndex - startIndex < limit) {
		const line = lines[endIndex];
		if (content.length + line.length > maxChars) {
			if (endIndex === startIndex) {
				// a single line longer than the budget still returns its start
				content = line.slice(0, maxChars);
				endIndex++;
				isLineCut = true;
			}
			break;
		}
		content += line;
		endIndex++;
	}

	return {
		content,
		totalLines,
		startLine: startIndex + 1,
		endLine: endIndex,
		truncated: endIndex < totalLines || isLineCut,
	};
};

/**
 * Replace exact text in a file's contents.
 *
 * The match is literal, whitespace included. Without `replaceAll` the text has
 * to be unique, so an edit cannot land on the wrong one of several identical
 * lines; the error says how many there were so the model can widen its match.
 *
 * @param original - The file's current contents.
 * @param oldText - The exact text to replace.
 * @param newText - What to put in its place.
 * @param replaceAll - Replace every occurrence rather than exactly one.
 * @return The new contents and how many replacements were made.
 * @throws FolderToolError when the text is missing, empty, or ambiguous.
 */
export const replaceFileText = (
	original: string,
	oldText: string,
	newText: string,
	replaceAll: boolean,
): { content: string; replacements: number } => {
	if (!oldText) {
		throw new FolderToolError(
			"old_text cannot be empty. To replace the whole file, use folder_write.",
		);
	}
	if (oldText === newText) {
		throw new FolderToolError("old_text and new_text are the same.");
	}

	const occurrences = countOccurrences(original, oldText);
	if (occurrences === 0) {
		throw new FolderToolError(
			"old_text was not found. It has to match the file exactly, including whitespace and line breaks. Read the file again and copy the text you want to replace.",
		);
	}
	if (occurrences > 1 && !replaceAll) {
		throw new FolderToolError(
			`old_text appears ${occurrences} times. Include more surrounding text so it matches once, or set replace_all to true.`,
		);
	}

	return {
		content: original.split(oldText).join(newText),
		replacements: occurrences,
	};
};

export { countOccurrences } from "@semoss/utility/text";
