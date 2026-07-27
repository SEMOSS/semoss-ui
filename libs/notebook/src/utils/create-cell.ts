import type { JupyterCell, NotebookExecutionData } from "../types";
import { getNotebookCellConfig } from "./cell-config";
import { ensureCellMetadataId } from "./cell-metadata";
import { normalizeSourceToArray } from "./source";

/**
 * Builds a brand-new JupyterCell (code or markdown) from a code-fence's
 * source + language, optionally seeded with the execution outputs it
 * produced when run from chat.
 */
export const createNotebookCell = (
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	existingMetadata?: Record<string, unknown>,
): JupyterCell => {
	const config = getNotebookCellConfig(lang);
	const metadata = ensureCellMetadataId({
		...(existingMetadata ?? {}),
		language: config.language,
	});

	if (config.cellType === "markdown") {
		return {
			cell_type: "markdown",
			metadata,
			source: normalizeSourceToArray(code),
		};
	}

	return {
		cell_type: "code",
		execution_count:
			typeof executionData?.executionCount === "number" ||
			executionData?.executionCount === null
				? executionData.executionCount
				: null,
		metadata,
		outputs: executionData?.outputs ?? [],
		source: normalizeSourceToArray(code),
	};
};
