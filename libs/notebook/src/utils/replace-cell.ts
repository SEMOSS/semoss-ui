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
import {
	applyNotebookLanguageMetadata,
	ensureNotebookVersion,
} from "./notebook-metadata";
import { sanitizeNotebookCell } from "./sanitize-cell";

/**
 * Replaces a single 1-based row in an existing .ipynb file's JSON content
 * ("Add to Notebook" when a row is selected in the notebook preview).
 * Returns null (instead of throwing) for malformed content or an
 * out-of-range row so the caller can show a clear error.
 */
export const replaceNotebookCell = (
	existingNotebookJson: string,
	rowNumber: number,
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

		if (!Array.isArray(notebook.cells)) {
			return null;
		}

		ensureNotebookVersion(notebook);
		applyNotebookLanguageMetadata(notebook, lang, metadataData, {
			preserveExisting: true,
		});
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

		const index = rowNumber - 1;
		if (index < 0 || index >= notebook.cells.length) {
			return null;
		}

		const existingCell = notebook.cells[index];
		const existingExecutionCount =
			existingCell &&
			existingCell.cell_type === "code" &&
			typeof existingCell.execution_count === "number"
				? existingCell.execution_count
				: null;

		notebook.cells[index] = createNotebookCell(
			code,
			lang,
			{
				executionCount:
					typeof executionData?.executionCount === "number" ||
					executionData?.executionCount === null
						? executionData.executionCount
						: existingExecutionCount,
				outputs: executionData?.outputs,
			},
			existingCell?.metadata,
		);

		return JSON.stringify(notebook, null, 2);
	} catch {
		return null;
	}
};
