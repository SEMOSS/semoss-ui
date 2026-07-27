import type { JupyterErrorOutput } from "../types";

/**
 * Normalizes a thrown/rejected value (Error instance, Pixel error object, or
 * a plain string) into nbformat's `error` output shape.
 */
export const toErrorOutput = (output: unknown): JupyterErrorOutput => {
	if (typeof output === "object" && output !== null) {
		const maybeError = output as {
			ename?: unknown;
			evalue?: unknown;
			traceback?: unknown;
			message?: unknown;
			name?: unknown;
		};

		const ename =
			typeof maybeError.ename === "string"
				? maybeError.ename
				: typeof maybeError.name === "string"
					? maybeError.name
					: "Error";

		const evalue =
			typeof maybeError.evalue === "string"
				? maybeError.evalue
				: typeof maybeError.message === "string"
					? maybeError.message
					: JSON.stringify(output);

		const traceback = Array.isArray(maybeError.traceback)
			? maybeError.traceback.map((entry) => String(entry))
			: [evalue];

		return {
			output_type: "error",
			ename,
			evalue,
			traceback,
		};
	}

	if (output instanceof Error) {
		return {
			output_type: "error",
			ename: output.name || "Error",
			evalue: output.message || "",
			traceback: [output.stack || output.message || ""],
		};
	}

	const message = typeof output === "string" ? output : String(output);
	return {
		output_type: "error",
		ename: "Error",
		evalue: message,
		traceback: [message],
	};
};
