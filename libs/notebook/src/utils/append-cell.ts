import type {
	JupyterCell,
	NotebookExecutionData,
	NotebookMetadataData,
} from "../types";
import {
	ensureNotebookCellMetadataIds,
	getNotebookLanguageFromMetadata,
} from "./cell-metadata";
import { createNotebookCell } from "./create-cell";
import { getNextNotebookExecutionCount } from "./execution-count";
import {
	applyNotebookLanguageMetadata,
	ensureNotebookVersion,
} from "./notebook-metadata";
import { sanitizeNotebookCell } from "./sanitize-cell";

/**
 * Appends a new cell to an existing .ipynb file's JSON content ("Add to
 * Notebook" when no row is selected but a notebook is actively open).
 * Returns null (instead of throwing) on malformed existing content so the
 * caller can show a clear error instead of crashing.
 */
export const appendCellToNotebook = (
	existingNotebookJson: string,
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	metadataData?: NotebookMetadataData,
): string | null => {
	try {
		const notebook = JSON.parse(existingNotebookJson) as {
			nbformat?: number;
			nbformat_minor?: number;
			metadata?: Record<string, unknown>;
			cells?: JupyterCell[];
			[key: string]: unknown;
		};

		ensureNotebookVersion(notebook);
		applyNotebookLanguageMetadata(notebook, lang, metadataData, {
			preserveExisting: true,
		});
		if (!Array.isArray(notebook.cells)) {
			notebook.cells = [];
		}

		const notebookLanguage = getNotebookLanguageFromMetadata(
			notebook.metadata,
		);
		notebook.cells = notebook.cells.map((cell) =>
			sanitizeNotebookCell(cell, notebookLanguage),
		);

		notebook.cells = ensureNotebookCellMetadataIds(
			notebook.cells,
			notebookLanguage,
		);

		const resolvedExecutionCount =
			typeof executionData?.executionCount === "number" ||
			executionData?.executionCount === null
				? executionData.executionCount
				: executionData
					? getNextNotebookExecutionCount(notebook)
					: null;

		notebook.cells.push(
			createNotebookCell(code, lang, {
				executionCount: resolvedExecutionCount,
				outputs: executionData?.outputs,
			}),
		);

		return JSON.stringify(notebook, null, 2);
	} catch {
		return null;
	}
};
