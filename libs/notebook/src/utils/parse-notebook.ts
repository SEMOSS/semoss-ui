import type { JupyterNotebook } from "../types";
import {
	ensureNotebookCellMetadataIds,
	getNotebookLanguageFromMetadata,
} from "./cell-metadata";
import { isRecordObject } from "./json";
import { DEFAULT_NBFORMAT, DEFAULT_NBFORMAT_MINOR } from "./notebook-metadata";
import { sanitizeNotebookCell } from "./sanitize-cell";

/**
 * Parses raw .ipynb file content into a JupyterNotebook, recovering from
 * malformed-but-recognizable payloads (missing/legacy nbformat, missing
 * cell metadata) instead of hard-rejecting them. Only genuinely
 * non-notebook-shaped content (not an object, or no `cells` array) and
 * invalid JSON are treated as unrecoverable errors.
 */
export const parseNotebookJson = (
	raw: string,
): { notebook: JupyterNotebook | null; error: string | null } => {
	if (!raw || !raw.trim()) {
		// An empty response body (new/not-yet-written file, or a transient
		// load race) is a distinct, expected case - report it plainly instead
		// of surfacing a raw "Unexpected end of JSON input" parser exception.
		return {
			notebook: null,
			error: "Notebook file is empty",
		};
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!isRecordObject(parsed)) {
			return {
				notebook: null,
				error: "Invalid .ipynb content",
			};
		}

		if (!Array.isArray(parsed.cells)) {
			return {
				notebook: null,
				error: "Invalid .ipynb content",
			};
		}

		// A missing/unexpected nbformat (e.g. an older export, or a hand-edited
		// file that omits the field) is still recoverable as long as `cells` is
		// a real array - we coerce nbformat to 4 below instead of rejecting the
		// whole file. Only reject payloads that aren't shaped like a notebook.
		const metadata = isRecordObject(parsed.metadata) ? parsed.metadata : {};
		const notebookLanguage = getNotebookLanguageFromMetadata(metadata);
		const cells = parsed.cells.map((cell) =>
			sanitizeNotebookCell(cell, notebookLanguage),
		);

		return {
			notebook: {
				...parsed,
				nbformat: DEFAULT_NBFORMAT,
				nbformat_minor:
					typeof parsed.nbformat_minor === "number"
						? parsed.nbformat_minor
						: DEFAULT_NBFORMAT_MINOR,
				metadata,
				cells: ensureNotebookCellMetadataIds(cells, notebookLanguage),
			},
			error: null,
		};
	} catch (error) {
		return {
			notebook: null,
			error:
				error instanceof Error
					? error.message
					: "Unable to parse .ipynb",
		};
	}
};
