import type { JupyterCellOutput } from "../types";
import { toErrorOutput } from "./error-output";
import { toSafeJsonString } from "./json";
import { toMimeBundleFromOutput } from "./mime-bundle";
import { sanitizeJupyterOutputs } from "./sanitize-output";

/**
 * Maps a raw Pixel execution result (or an already-shaped array of
 * JupyterCellOutput objects) into one or more nbformat-compatible outputs.
 */
export const runtimeOutputToJupyterOutputs = (
	output: unknown,
	options?: { isError?: boolean; operationType?: string | string[] },
): JupyterCellOutput[] => {
	if (output === undefined || output === null) {
		return [];
	}

	if (Array.isArray(output)) {
		const asOutputs = output as Array<{ output_type?: unknown }>;
		if (asOutputs.every((item) => typeof item?.output_type === "string")) {
			return sanitizeJupyterOutputs(output);
		}
	}

	if (options?.isError) {
		return [toErrorOutput(output)];
	}

	const data = toMimeBundleFromOutput(output, options?.operationType);

	// Guarantee a text/plain fallback regardless of which branch of
	// toMimeBundleFromOutput produced `data` (e.g. a pre-shaped `{ data }`
	// envelope may omit it) so every renderer always has something to fall
	// back to instead of an empty/unrenderable output.
	if (typeof data["text/plain"] !== "string") {
		data["text/plain"] = toSafeJsonString(output);
	}

	return [
		{
			output_type: "display_data",
			data,
			metadata: {},
		},
	];
};
