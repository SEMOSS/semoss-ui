import type { JupyterCellOutput } from "../types";
import { isRecordObject, toSafeJsonString } from "./json";
import { normalizeUnknownSourceToArray } from "./source";

const sanitizeOutputData = (value: unknown): Record<string, unknown> => {
	if (isRecordObject(value)) {
		return value;
	}

	const text = value === undefined || value === null ? "" : String(value);
	return {
		"text/plain": text,
	};
};

/**
 * Normalizes a single loosely-typed output object (e.g. from a hand-edited
 * or legacy .ipynb file) into a well-formed JupyterCellOutput, so downstream
 * rendering never has to guard against a malformed shape.
 */
const sanitizeJupyterOutput = (output: unknown): JupyterCellOutput => {
	if (!isRecordObject(output)) {
		return {
			output_type: "display_data",
			data: {
				"text/plain": toSafeJsonString(output),
			},
			metadata: {},
		};
	}

	const outputType = output.output_type;
	if (outputType === "stream") {
		return {
			output_type: "stream",
			name: output.name === "stderr" ? "stderr" : "stdout",
			text: normalizeUnknownSourceToArray(output.text),
		};
	}

	if (outputType === "error") {
		const ename =
			typeof output.ename === "string" && output.ename
				? output.ename
				: "Error";
		const evalue =
			typeof output.evalue === "string" ? output.evalue : "Unknown error";
		const traceback = Array.isArray(output.traceback)
			? output.traceback.map((entry) => String(entry))
			: [evalue];

		return {
			output_type: "error",
			ename,
			evalue,
			traceback,
		};
	}

	if (outputType === "execute_result") {
		return {
			output_type: "execute_result",
			data: sanitizeOutputData(output.data),
			metadata: isRecordObject(output.metadata) ? output.metadata : {},
			execution_count:
				typeof output.execution_count === "number" &&
				Number.isFinite(output.execution_count)
					? output.execution_count
					: null,
		};
	}

	if (outputType === "update_display_data") {
		return {
			output_type: "update_display_data",
			data: sanitizeOutputData(output.data),
			metadata: isRecordObject(output.metadata) ? output.metadata : {},
			transient: isRecordObject(output.transient)
				? output.transient
				: undefined,
		};
	}

	if (outputType === "display_data") {
		return {
			output_type: "display_data",
			data: sanitizeOutputData(output.data),
			metadata: isRecordObject(output.metadata) ? output.metadata : {},
		};
	}

	return {
		output_type: "display_data",
		data: {
			"text/plain": toSafeJsonString(output),
		},
		metadata: {},
	};
};

export const sanitizeJupyterOutputs = (
	outputs: unknown,
): JupyterCellOutput[] => {
	if (!Array.isArray(outputs)) {
		return [];
	}

	return outputs.map((entry) => sanitizeJupyterOutput(entry));
};
