/**
 * Minimal, self-contained nbformat (Jupyter .ipynb) helpers. Intentionally a
 * lightweight, dependency-free local implementation instead of a heavier
 * renderer (plotly/vega/dompurify/katex), since we do not want to pull those
 * into `@semoss/shared`.
 */

import { IMAGE_MIME_TYPES, splitInlineImages } from "../../utility/image";
import type {
	JupyterCell,
	JupyterCellType,
	JupyterCodeCell,
	JupyterNotebook,
	JupyterOutput,
} from "./notebook.types";

// Built from a char code to avoid a control character in a regex literal.
const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

/** Read a MIME entry from an output data bundle as a single string. */
export const getMimeString = (
	data: Record<string, unknown>,
	mimeType: string,
): string | null => {
	const value = data[mimeType];
	if (typeof value === "string") return value;
	if (Array.isArray(value)) {
		return value.map((entry) => String(entry)).join("");
	}
	return null;
};

/** Strip ANSI SGR escape sequences so colored logs/tracebacks render as plain text. */
export const stripAnsi = (value: string): string =>
	value.replace(ANSI_ESCAPE, "");

/**
 * The plain-text representation of an output for the clipboard, or null when
 * there is nothing useful to copy (image-only or widget output).
 */
export const getOutputCopyText = (output: JupyterOutput): string | null => {
	if (output.output_type === "stream") {
		return stripAnsi(normalizeSource(output.text));
	}

	if (output.output_type === "error") {
		const traceback =
			Array.isArray(output.traceback) && output.traceback.length
				? output.traceback.join("\n")
				: `${output.ename}: ${output.evalue}`;
		return stripAnsi(traceback);
	}

	const { data } = output;
	const plain = getMimeString(data, "text/plain");
	if (plain !== null) {
		return stripAnsi(plain);
	}

	// Image-only, HTML-only, and widget outputs have no useful plain text.
	const hasImage = IMAGE_MIME_TYPES.some(
		(mime) => getMimeString(data, mime) !== null,
	);
	const hasHtml = getMimeString(data, "text/html") !== null;
	const isWidget = "application/vnd.jupyter.widget-view+json" in data;
	if (hasImage || hasHtml || isWidget) {
		return null;
	}

	return JSON.stringify(data, null, 2);
};

/** nbformat allows `source`/`text` as either a string or an array of lines. */
export const normalizeSource = (source: string | string[]): string =>
	Array.isArray(source) ? source.join("") : (source ?? "");

/** Narrow an unknown parsed value to a plain object, or `{}` when it is not one. */
const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};

/** Narrow an unknown parsed value to an nbformat `source` (string or lines), else `""`. */
const asSource = (value: unknown): string | string[] =>
	typeof value === "string" || Array.isArray(value)
		? (value as string | string[])
		: "";

/** Generate a new unique cell id (nbformat 4.5 `id`), preferring `crypto.randomUUID`. */
const generateCellId = (): string =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `cell-${Math.random().toString(36).slice(2)}-${Date.now()}`;

/** Coerce a loosely-typed parsed cell into a well-formed JupyterCell. */
const normalizeCell = (value: unknown): JupyterCell => {
	const record = asRecord(value);
	const id =
		typeof record.id === "string" && record.id
			? record.id
			: generateCellId();

	if (record.cell_type === "markdown") {
		return {
			id,
			cell_type: "markdown",
			metadata: asRecord(record.metadata),
			source: asSource(record.source),
		};
	}

	if (record.cell_type === "raw") {
		return {
			id,
			cell_type: "raw",
			metadata: asRecord(record.metadata),
			source: asSource(record.source),
		};
	}

	return {
		id,
		cell_type: "code",
		execution_count:
			typeof record.execution_count === "number"
				? record.execution_count
				: null,
		metadata: asRecord(record.metadata),
		outputs: Array.isArray(record.outputs)
			? (record.outputs as JupyterOutput[])
			: [],
		source: asSource(record.source),
	};
};

/**
 * Parse and validate raw .ipynb content into a JupyterNotebook, throwing when
 * the content is empty, not valid JSON, or not shaped like a notebook (missing
 * a `cells` array). Callers always get back a well-formed notebook or an error.
 */
export const validateNotebook = (raw: string): JupyterNotebook => {
	if (!raw || !raw.trim()) {
		throw new Error("Notebook file is empty");
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (e) {
		throw new Error(
			e instanceof Error ? e.message : "Unable to parse .ipynb",
		);
	}

	const record = asRecord(parsed);
	if (!Array.isArray(record.cells)) {
		throw new Error("Invalid .ipynb content");
	}

	return {
		nbformat: typeof record.nbformat === "number" ? record.nbformat : 4,
		nbformat_minor:
			typeof record.nbformat_minor === "number"
				? record.nbformat_minor
				: 5,
		metadata: asRecord(record.metadata),
		cells: record.cells.map(normalizeCell),
	};
};

/** Next `In [n]` counter — one past the highest existing execution count. */
export const nextExecutionCount = (notebook: JupyterNotebook): number => {
	let max = 0;
	for (const cell of notebook.cells) {
		if (
			cell.cell_type === "code" &&
			typeof cell.execution_count === "number"
		) {
			max = Math.max(max, cell.execution_count);
		}
	}
	return max + 1;
};

/**
 * Each Pixel operationType stores its payload in a different slot of the
 * response envelope; pick the right slot so the real value is mapped instead of
 * the wrapper. Mirrors the terminal REPL / notebook output unwrap.
 */
export const unwrapPixelOutput = (last?: {
	operationType?: string[];
	output?: unknown;
}): unknown => {
	if (!last) return undefined;
	const op = last.operationType ?? [];
	const out = last.output;
	if (op.includes("CUSTOM_DATA_STRUCTURE")) return out;
	if (op.includes("FORMATTED_DATA_SET")) return (out as unknown[])?.[0];
	if (op.includes("CODE_EXECUTION")) {
		return (out as Array<{ output?: unknown }>)?.[0]?.output;
	}
	if (op.includes("CODE")) {
		return (out as Array<{ value?: unknown[] }>)?.[0]?.value?.[0];
	}
	if (op.includes("ERROR")) return (out as unknown[])?.[0];
	if (op.includes("CONST_STRING")) return (out as unknown[])?.[0];
	if (op.includes("INVALID_SYNTAX")) return (out as unknown[])?.[0];
	if (op.includes("VECTOR")) return (out as unknown[])?.[0];
	return out;
};

/** Build a ready-to-insert code cell from an external (e.g. chat) execution. */
export const createCodeCellFromExecution = (
	source: string,
	outputs: JupyterOutput[] = [],
	executionCount: number | null = null,
): JupyterCodeCell => ({
	id: generateCellId(),
	cell_type: "code",
	execution_count: executionCount,
	metadata: {},
	outputs,
	source,
});

/**
 * Convert an execution's console logs plus its unwrapped Pixel value into
 * nbformat outputs — the single mapping shared by the Notebook editor's cell
 * runs and the chat "Add to Notebook" action so both agree on output shape.
 */
export const toCellOutputs = (
	logs: string[],
	value: unknown,
	isError: boolean,
	executionCount: number,
): JupyterOutput[] => {
	const outputs: JupyterOutput[] = [];

	if (logs.length > 0) {
		outputs.push({
			output_type: "stream",
			name: "stdout",
			text: logs,
		});
	}

	if (isError) {
		const message = typeof value === "string" ? value : String(value ?? "");

		outputs.push({
			output_type: "error",
			ename: "Error",
			evalue: message,
			traceback: message ? message.split("\n") : [],
		});

		return outputs;
	}

	if (value === undefined || value === null || value === "") {
		return outputs;
	}

	if (typeof value === "string") {
		const segments = splitInlineImages(value);
		if (segments.some((segment) => segment.kind === "image")) {
			for (const segment of segments) {
				if (segment.kind === "image") {
					outputs.push({
						output_type: "display_data",
						data: {
							[segment.mime]: segment.data,
						},
						metadata: {},
					});
					continue;
				}

				if (segment.value.trim()) {
					outputs.push({
						output_type: "stream",
						name: "stdout",
						text: segment.value,
					});
				}
			}

			return outputs;
		}

		outputs.push({
			output_type: "stream",
			name: "stdout",
			text: value,
		});

		return outputs;
	}

	outputs.push({
		output_type: "execute_result",
		data: {
			"text/plain": JSON.stringify(value, null, 2),
		},
		metadata: {},
		execution_count: executionCount,
	});

	return outputs;
};

/** Create a new, empty cell of the given type. */
export const createCell = (type: JupyterCellType): JupyterCell => {
	const id = generateCellId();
	if (type === "markdown") {
		return {
			id,
			cell_type: "markdown",
			metadata: {},
			source: "",
		};
	}
	if (type === "raw") {
		return {
			id,
			cell_type: "raw",
			metadata: {},
			source: "",
		};
	}
	return {
		id,
		cell_type: "code",
		execution_count: null,
		metadata: {},
		outputs: [],
		source: "",
	};
};

/** Insert a cell at `index`, appending when the index is omitted / out of range. */
export const insertCell = (
	notebook: JupyterNotebook,
	cell: JupyterCell,
	index?: number,
): JupyterNotebook => {
	const cells = [...notebook.cells];
	const at =
		index === undefined || index < 0 || index > cells.length
			? cells.length
			: index;
	cells.splice(at, 0, cell);
	return { ...notebook, cells };
};

/** Convert a notebook to a Python script; markdown → block comments, raw cells omitted. */
export const exportAsPythonScript = (notebook: JupyterNotebook): string => {
	const parts: string[] = [];
	for (const cell of notebook.cells) {
		const src = normalizeSource(cell.source);
		if (cell.cell_type === "code") {
			if (src.trim()) {
				parts.push(src);
				parts.push("");
			}
		} else if (cell.cell_type === "markdown") {
			if (src.trim()) {
				parts.push("# ---");
				for (const line of src.split("\n")) {
					parts.push(`# ${line}`);
				}
				parts.push("# ---");
				parts.push("");
			}
		}
	}
	return parts.join("\n");
};
