import type { JupyterCellOutput, JupyterNotebook } from "../types";
import { getNextNotebookExecutionCount } from "./execution-count";
import { extractNotebookInlineDisplayOutputsFromLogs } from "./extract-display-outputs";
import { runtimeOutputToJupyterOutputs } from "./runtime-output";
import { unwrapPixelOutput } from "./unwrap-pixel-output";

export interface NotebookConsoleResult {
	errors: string[];
	results: Array<{ operationType?: string[]; output?: unknown }>;
	logs: string[];
}

export interface NotebookCellExecutionOutcome {
	outputs: JupyterCellOutput[];
	executionCount?: number;
}

/**
 * Maps a Pixel console execution result (errors/results/logs) back into
 * Jupyter-style cell outputs: stdout logs and inline display_data captured
 * by the execution shim are emitted first, then any Pixel-level errors, then
 * each result frame's unwrapped value in execution order. Falls back to a
 * "Success (no output)" notice when nothing else was produced, matching
 * real Jupyter's blank-output convention.
 */
export const mapNotebookConsoleResultToOutputs = (
	consoleResult: NotebookConsoleResult,
	notebook: JupyterNotebook,
): NotebookCellExecutionOutcome => {
	const { errors, results, logs } = consoleResult;
	const outputList: JupyterCellOutput[] = [];
	const { cleanedLogs, displayOutputs } =
		extractNotebookInlineDisplayOutputsFromLogs(logs);

	if (cleanedLogs.length > 0) {
		outputList.push({
			output_type: "stream",
			name: "stdout",
			text: cleanedLogs.join("\n"),
		});
	}

	if (displayOutputs.length > 0) {
		outputList.push(...displayOutputs);
	}

	if (errors.length > 0) {
		return {
			outputs: [
				...outputList,
				...runtimeOutputToJupyterOutputs(errors.join("\n"), {
					isError: true,
				}),
			],
			executionCount: getNextNotebookExecutionCount(notebook),
		};
	}

	for (const result of results) {
		// Pixel can emit multiple operation frames; keep each frame as a
		// separate notebook output in execution order.
		const operationTypes = result.operationType ?? [];
		const isError =
			operationTypes.includes("ERROR") ||
			operationTypes.includes("INVALID_SYNTAX");
		const value = unwrapPixelOutput(result ?? {});

		if (value === undefined || value === null) {
			continue;
		}

		if (typeof value === "string" && value.trim().length === 0) {
			continue;
		}

		outputList.push(
			...runtimeOutputToJupyterOutputs(value, {
				isError,
				operationType: operationTypes,
			}),
		);
	}

	if (outputList.length === 0) {
		outputList.push(
			...runtimeOutputToJupyterOutputs("Success (no output)"),
		);
	}

	return {
		outputs: outputList,
		executionCount: getNextNotebookExecutionCount(notebook),
	};
};
