import type {
	JupyterNotebook,
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
	DEFAULT_NBFORMAT,
	DEFAULT_NBFORMAT_MINOR,
} from "./notebook-metadata";

/**
 * Builds a brand-new one-cell .ipynb file's JSON content from a single
 * code-fence, used by the "create a new notebook" path of Add to Notebook.
 */
export const createNotebookFileContent = (
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	metadataData?: NotebookMetadataData,
): string => {
	const content: JupyterNotebook = {
		nbformat: DEFAULT_NBFORMAT,
		nbformat_minor: DEFAULT_NBFORMAT_MINOR,
		metadata: {},
		cells: [createNotebookCell(code, lang, executionData)],
	};

	applyNotebookLanguageMetadata(content, lang, metadataData);
	content.cells = ensureNotebookCellMetadataIds(
		content.cells,
		getNotebookLanguageFromMetadata(content.metadata),
	);

	return JSON.stringify(content, null, 2);
};
