import type { JupyterCellOutput } from "../types";
import { base64ToText } from "./base64";
import {
	INLINE_DISPLAY_BEGIN_PREFIX,
	INLINE_DISPLAY_CHUNK_PREFIX,
	INLINE_DISPLAY_END_MARKER,
} from "./inline-display-markers";

/**
 * Recovers the inline display_data outputs (matplotlib figures, IPython
 * display() calls, etc.) that execution-source.ts's shim emitted through
 * marker-delimited stdout chunks, and strips those marker lines out of the
 * plain console log so they don't also show up as noisy stream output.
 */
export const extractNotebookInlineDisplayOutputsFromLogs = (logs: string[]) => {
	const cleanedLogLines: string[] = [];
	const displayOutputs: JupyterCellOutput[] = [];
	let collecting = false;
	let currentMimeType = "image/png";
	let currentBase64Chunks: string[] = [];

	const flush = () => {
		if (!collecting) {
			return;
		}

		// Marker-delimited chunks are stitched back into a MIME bundle so the
		// output lands in a standard display_data cell output. Binary image
		// mimetypes keep the base64 payload as-is (nbformat's own encoding for
		// image data); image/svg+xml is XML text, not binary, and text-based
		// mimetypes need base64-decoding back to their real text/JSON value
		// so they render the same as any other output.
		const base64Data = currentBase64Chunks.join("").replace(/\s+/g, "");
		if (base64Data) {
			if (
				currentMimeType.startsWith("image/") &&
				currentMimeType !== "image/svg+xml"
			) {
				displayOutputs.push({
					output_type: "display_data",
					data: {
						[currentMimeType]: base64Data,
						"text/plain": `data:${currentMimeType};base64,${base64Data}`,
					},
					metadata: {},
				});
			} else if (currentMimeType === "application/json") {
				const decoded = base64ToText(base64Data);
				try {
					displayOutputs.push({
						output_type: "display_data",
						data: {
							"application/json": JSON.parse(decoded),
							"text/plain": decoded,
						},
						metadata: {},
					});
				} catch {
					displayOutputs.push({
						output_type: "display_data",
						data: { "text/plain": decoded },
						metadata: {},
					});
				}
			} else {
				const decoded = base64ToText(base64Data);
				displayOutputs.push({
					output_type: "display_data",
					data: {
						[currentMimeType]: decoded,
						"text/plain": decoded,
					},
					metadata: {},
				});
			}
		}

		collecting = false;
		currentMimeType = "image/png";
		currentBase64Chunks = [];
	};

	for (const chunk of logs) {
		for (const line of chunk.split(/\r?\n/)) {
			if (line.startsWith(INLINE_DISPLAY_BEGIN_PREFIX)) {
				flush();
				collecting = true;
				currentMimeType =
					line.slice(INLINE_DISPLAY_BEGIN_PREFIX.length).trim() ||
					"image/png";
				currentBase64Chunks = [];
				continue;
			}

			if (line.startsWith(INLINE_DISPLAY_CHUNK_PREFIX)) {
				if (collecting) {
					currentBase64Chunks.push(
						line.slice(INLINE_DISPLAY_CHUNK_PREFIX.length).trim(),
					);
				}
				continue;
			}

			if (line.trim() === INLINE_DISPLAY_END_MARKER) {
				flush();
				continue;
			}

			cleanedLogLines.push(line);
		}
	}

	flush();

	const hasCapturedOutputs = displayOutputs.length > 0;
	const filteredLogLines = hasCapturedOutputs
		? cleanedLogLines.filter((line) => {
				const trimmed = line.trim();
				if (/^Figure\(\d+x\d+\)\s*$/.test(trimmed)) {
					return false;
				}

				if (
					trimmed.includes(
						"UserWarning: Starting a Matplotlib GUI outside of the main thread will likely fail.",
					)
				) {
					return false;
				}

				return true;
			})
		: cleanedLogLines;

	return {
		cleanedLogs: filteredLogLines,
		displayOutputs,
	};
};
