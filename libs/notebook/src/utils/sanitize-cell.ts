import type { JupyterCell } from "../types";
import { ensureCellMetadataId, getCellLanguage } from "./cell-metadata";
import { isRecordObject } from "./json";
import { sanitizeJupyterOutputs } from "./sanitize-output";
import { normalizeUnknownSourceToArray } from "./source";

/**
 * Normalizes a single loosely-typed cell object (e.g. from a hand-edited or
 * legacy .ipynb file) into a well-formed JupyterCell, backfilling
 * metadata.id/metadata.language and sanitizing its outputs.
 */
export const sanitizeNotebookCell = (
	cell: unknown,
	notebookLanguage?: string,
): JupyterCell => {
	if (!isRecordObject(cell)) {
		return {
			cell_type: "raw",
			metadata: ensureCellMetadataId({ language: "raw" }),
			source: [],
		};
	}

	const cellType =
		cell.cell_type === "code" ||
		cell.cell_type === "markdown" ||
		cell.cell_type === "raw"
			? cell.cell_type
			: "raw";
	const metadata = ensureCellMetadataId(
		isRecordObject(cell.metadata) ? cell.metadata : {},
	);
	metadata.language = getCellLanguage(cellType, metadata, notebookLanguage);
	const source = normalizeUnknownSourceToArray(cell.source);

	if (cellType === "code") {
		return {
			cell_type: "code",
			execution_count:
				typeof cell.execution_count === "number" &&
				Number.isFinite(cell.execution_count)
					? cell.execution_count
					: null,
			metadata,
			outputs: sanitizeJupyterOutputs(cell.outputs),
			source,
		};
	}

	if (cellType === "markdown") {
		return {
			cell_type: "markdown",
			metadata,
			source,
		};
	}

	return {
		cell_type: "raw",
		metadata,
		source,
	};
};
