import type { RunNotebookCellRequest } from "../types";
import { buildExecutePixel } from "./execute-pixel";
import { buildNotebookExecutionSource } from "./execution-source";

export interface PreparedCellExecution {
	/** Lowercased cell language, resolved from cell metadata or notebook metadata. */
	language: string;
	/** Runnable pixel expression, or null when the language has no server-side reactor. */
	executePixel: string | null;
}

/**
 * Resolves a notebook code cell's language and builds the Pixel expression
 * to run it, wrapping Python sources with the matplotlib/IPython-display
 * execution shim first. Returns `executePixel: null` when the language has
 * no server-side Pixel reactor, so the caller can surface an
 * unsupported-language error instead of attempting to execute.
 */
export const prepareNotebookCellExecution = (
	request: RunNotebookCellRequest,
): PreparedCellExecution => {
	const source = Array.isArray(request.cell.source)
		? request.cell.source.join("")
		: request.cell.source;
	const language = String(
		request.cell.metadata?.language ??
			request.notebook.metadata?.language_info?.name ??
			"python",
	).toLowerCase();

	const sourceForExecution = buildNotebookExecutionSource(language, source);
	const executePixel = buildExecutePixel(language, sourceForExecution);

	return { language, executePixel };
};
