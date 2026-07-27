/**
 * Minimal, self-contained nbformat (Jupyter .ipynb) types and helpers.
 * Intentionally a lightweight local copy — the `@semoss/notebook` package models
 * the same shape with far heavier rendering deps (plotly/vega/dompurify/katex),
 * which we do not want to pull into `@semoss/shared`.
 */

export type JupyterOutput =
	| {
			output_type: "stream";
			name: "stdout" | "stderr";
			text: string | string[];
	  }
	| {
			output_type: "display_data";
			data: Record<string, unknown>;
			metadata?: Record<string, unknown>;
	  }
	| {
			output_type: "execute_result";
			data: Record<string, unknown>;
			metadata?: Record<string, unknown>;
			execution_count: number | null;
	  }
	| {
			output_type: "error";
			ename: string;
			evalue: string;
			traceback: string[];
	  };

export interface JupyterCodeCell {
	/** Stable id for React keys / reordering (nbformat 4.5+ cell `id`). */
	id: string;
	cell_type: "code";
	execution_count: number | null;
	metadata: Record<string, unknown>;
	outputs: JupyterOutput[];
	source: string | string[];
}

export interface JupyterMarkdownCell {
	id: string;
	cell_type: "markdown";
	metadata: Record<string, unknown>;
	source: string | string[];
}

export interface JupyterRawCell {
	id: string;
	cell_type: "raw";
	metadata: Record<string, unknown>;
	source: string | string[];
}

export type JupyterCell =
	| JupyterCodeCell
	| JupyterMarkdownCell
	| JupyterRawCell;

/** The set of types a notebook cell can be. */
export type CellType = JupyterCell["cell_type"];

export interface JupyterNotebook {
	nbformat: number;
	nbformat_minor: number;
	metadata: Record<string, unknown>;
	cells: JupyterCell[];
}

/** Result of running a single code cell. */
export interface RunCellResult {
	outputs: JupyterOutput[];
	executionCount: number | null;
}

/** nbformat allows `source`/`text` as either a string or an array of lines. */
export const normalizeSource = (source: string | string[]): string =>
	Array.isArray(source) ? source.join("") : (source ?? "");

// Strip ANSI SGR escape sequences (colored tracebacks/logs) so they render as
// plain text. Built from a char code to avoid a control character in a regex
// literal (biome lint/suspicious/noControlCharactersInRegex).
const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

export const stripAnsi = (value: string): string =>
	value.replace(ANSI_ESCAPE, "");

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};

const asSource = (value: unknown): string | string[] =>
	typeof value === "string" || Array.isArray(value)
		? (value as string | string[])
		: "";

/** Generate a stable cell id, reusing the file's nbformat id when present. */
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
 * Parse raw .ipynb file content into a JupyterNotebook. Only content that isn't
 * shaped like a notebook (not an object, or missing a `cells` array) or invalid
 * JSON is treated as an unrecoverable error.
 */
export const parseNotebook = (
	raw: string,
): { notebook: JupyterNotebook | null; error: string | null } => {
	if (!raw || !raw.trim()) {
		return { notebook: null, error: "Notebook file is empty" };
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		const record = asRecord(parsed);

		if (!Array.isArray(record.cells)) {
			return { notebook: null, error: "Invalid .ipynb content" };
		}

		return {
			notebook: {
				nbformat:
					typeof record.nbformat === "number" ? record.nbformat : 4,
				nbformat_minor:
					typeof record.nbformat_minor === "number"
						? record.nbformat_minor
						: 5,
				metadata: asRecord(record.metadata),
				cells: record.cells.map(normalizeCell),
			},
			error: null,
		};
	} catch (e) {
		return {
			notebook: null,
			error: e instanceof Error ? e.message : "Unable to parse .ipynb",
		};
	}
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

/** Build an nbformat error output from a message. */
export const toErrorOutput = (message: string): JupyterOutput => ({
	output_type: "error",
	ename: "Error",
	evalue: message,
	traceback: message ? message.split("\n") : [],
});

/** Map an unwrapped Pixel value into nbformat outputs. */
export const toRuntimeOutputs = (
	value: unknown,
	executionCount: number,
): JupyterOutput[] => {
	if (value === undefined || value === null || value === "") {
		return [];
	}
	if (typeof value === "string") {
		return [{ output_type: "stream", name: "stdout", text: value }];
	}
	return [
		{
			output_type: "execute_result",
			data: { "text/plain": JSON.stringify(value, null, 2) },
			metadata: {},
			execution_count: executionCount,
		},
	];
};

/** Replace a single code cell's outputs/execution count, immutably. */
export const applyRunResult = (
	notebook: JupyterNotebook,
	index: number,
	result: RunCellResult,
): JupyterNotebook => ({
	...notebook,
	cells: notebook.cells.map((cell, cellIndex) =>
		cellIndex === index && cell.cell_type === "code"
			? {
					...cell,
					outputs: result.outputs,
					execution_count: result.executionCount,
				}
			: cell,
	),
});

/**
 * Replace a single cell's source, immutably. Works for any cell type; the
 * per-type branches keep the discriminated union intact instead of spreading
 * over the whole union (which would widen the result type).
 */
export const setCellSource = (
	notebook: JupyterNotebook,
	index: number,
	source: string,
): JupyterNotebook => ({
	...notebook,
	cells: notebook.cells.map((cell, cellIndex) => {
		if (cellIndex !== index) {
			return cell;
		}
		if (cell.cell_type === "code") {
			return { ...cell, source };
		}
		if (cell.cell_type === "markdown") {
			return { ...cell, source };
		}
		return { ...cell, source };
	}),
});

/** Move a cell from one index to another, immutably. */
export const moveCell = (
	notebook: JupyterNotebook,
	from: number,
	to: number,
): JupyterNotebook => {
	const { length } = notebook.cells;
	if (from === to || from < 0 || to < 0 || from >= length || to >= length) {
		return notebook;
	}
	const cells = [...notebook.cells];
	const [moved] = cells.splice(from, 1);
	cells.splice(to, 0, moved);
	return { ...notebook, cells };
};

/** Remove the cell at the given index, immutably. */
export const deleteCell = (
	notebook: JupyterNotebook,
	index: number,
): JupyterNotebook => ({
	...notebook,
	cells: [
		...notebook.cells.slice(0, index),
		...notebook.cells.slice(index + 1),
	],
});

/** Create a new, empty cell of the given type. */
export const createCell = (type: CellType): JupyterCell => {
	const id = generateCellId();
	if (type === "markdown") {
		return { id, cell_type: "markdown", metadata: {}, source: "" };
	}
	if (type === "raw") {
		return { id, cell_type: "raw", metadata: {}, source: "" };
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

/**
 * Convert a cell to a different type, preserving its id, metadata, and source.
 * Per-type branches keep the discriminated union intact.
 */
export const changeCellType = (
	notebook: JupyterNotebook,
	index: number,
	type: CellType,
): JupyterNotebook => ({
	...notebook,
	cells: notebook.cells.map((cell, cellIndex) => {
		if (cellIndex !== index || cell.cell_type === type) {
			return cell;
		}
		const base = {
			id: cell.id,
			metadata: cell.metadata,
			source: cell.source,
		};
		if (type === "markdown") {
			return { ...base, cell_type: "markdown" as const };
		}
		if (type === "raw") {
			return { ...base, cell_type: "raw" as const };
		}
		return {
			...base,
			cell_type: "code" as const,
			execution_count: null,
			outputs: [],
		};
	}),
});
