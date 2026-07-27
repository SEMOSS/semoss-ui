import type {
	JupyterCellOutput,
	NotebookExecutionData,
	NotebookExecutionResultInput,
} from "../types";
import { runtimeOutputToJupyterOutputs } from "./runtime-output";
import { normalizeSourceToArray } from "./source";

/**
 * Converts a completed chat/inline code execution result (stdout logs + raw
 * return value) into the outputs array a notebook cell would store, so
 * "Add to Notebook" persists what the user actually saw.
 */
export const toNotebookExecutionData = (
	result: NotebookExecutionResultInput | null,
): NotebookExecutionData | undefined => {
	if (!result || result.pending) return undefined;

	const outputs: JupyterCellOutput[] = [];

	if (result.logs.length > 0) {
		outputs.push({
			output_type: "stream",
			name: "stdout",
			text: normalizeSourceToArray(result.logs.join("\n")),
		});
	}

	outputs.push(
		...runtimeOutputToJupyterOutputs(result.rawOutput ?? result.output, {
			isError: result.isError,
		}),
	);

	return {
		outputs,
	};
};
