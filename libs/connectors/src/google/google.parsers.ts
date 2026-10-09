import { isRecord } from "@semoss/utility/object";
import { readNonBlankString } from "@semoss/utility/text";
import type {
	GoogleDoc,
	GoogleDocContent,
	GoogleDriveFile,
} from "./google.types";

/*
 * The Google reactors pass Google's data through thinly, with null fields left
 * out. As with Microsoft, entries missing what the viewers need are dropped
 * and a response of the wrong shape is an error.
 */

/**
 * Parse each entry of a list the reactor returned bare, keeping those that
 * parse.
 *
 * @param raw - The reactor's output.
 * @param what - What the list should hold, for the error.
 * @param parse - Reads one entry, or returns null to drop it.
 * @return The parsed entries.
 * @throws Error when the output is not a list.
 */
const parseList = <T>(
	raw: unknown,
	what: string,
	parse: (entry: unknown) => T | null,
): T[] => {
	if (!Array.isArray(raw)) {
		throw new Error(`The response did not include ${what}.`);
	}
	const parsed: T[] = [];
	for (const entry of raw) {
		const item = parse(entry);
		if (item) {
			parsed.push(item);
		}
	}
	return parsed;
};

/**
 * The files `GoogleDriveList` returns, by name.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The files.
 */
export const parseDriveFiles = (raw: unknown): GoogleDriveFile[] =>
	parseList(raw, "any files", (entry): GoogleDriveFile | null => {
		if (!isRecord(entry)) {
			return null;
		}
		const id = readNonBlankString(entry.id);
		if (!id) {
			return null;
		}
		return {
			id: id,
			name: readNonBlankString(entry.name) ?? id,
			mimeType: readNonBlankString(entry.mimeType),
		};
	}).sort((a, b) =>
		a.name.localeCompare(b.name, undefined, {
			numeric: true,
			sensitivity: "base",
		}),
	);

/**
 * The documents `GoogleDocsList` returns, by title.
 *
 * @param raw - The reactor's output, a bare list.
 * @return The documents.
 */
export const parseGoogleDocs = (raw: unknown): GoogleDoc[] =>
	parseList(raw, "any documents", (entry): GoogleDoc | null => {
		if (!isRecord(entry)) {
			return null;
		}
		const id = readNonBlankString(entry.id);
		if (!id) {
			return null;
		}
		return { id: id, title: readNonBlankString(entry.title) ?? id };
	}).sort((a, b) =>
		a.title.localeCompare(b.title, undefined, {
			numeric: true,
			sensitivity: "base",
		}),
	);

/**
 * A document's text, from `GoogleDocsRead`.
 *
 * @param raw - The reactor's output.
 * @return The title and text.
 * @throws Error when the response is not a document.
 */
export const parseGoogleDocContent = (raw: unknown): GoogleDocContent => {
	if (!isRecord(raw)) {
		throw new Error("The response did not include the document.");
	}
	return {
		title: readNonBlankString(raw.title) ?? "",
		content: typeof raw.content === "string" ? raw.content : "",
	};
};
