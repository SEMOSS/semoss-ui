/**
 * Converters between SEMOSS notebook format and Jupyter .ipynb format
 */

export type {
	JupyterCell,
	JupyterCellOutput,
	JupyterNotebook,
	JupyterNotebookMetadata,
	SemossCell,
	SemossNotebook,
} from "./types";

import type {
	JupyterCell,
	JupyterCellOutput,
	JupyterNotebook,
	SemossCell,
	SemossNotebook,
} from "./types";

/**
 * Minimal interface describing the live CellState we need from the renderer.
 * Kept loose so this package does not depend on @semoss/renderer.
 */
export interface LiveCellState {
	id: string;
	widget: string;
	isExecuted: boolean;
	executionCount?: number | null;
	isError: boolean;
	operation: string[];
	output: unknown;
	messages: string[] | undefined;
	parameters: Record<string, unknown>;
}

export interface LiveNotebookState {
	id: string;
	list: string[];
	cells: Record<string, LiveCellState>;
}

/**
 * Convert language code to Jupyter language name
 */
const toJupyterLanguage = (lang: string): string => {
	const normalized = lang.toLowerCase();
	if (normalized === "r") return "r";
	if (normalized === "sql") return "sql";
	return "python";
};

/**
 * Normalize source to array format (Jupyter standard)
 */
const normalizeSource = (source: string | string[]): string[] => {
	if (Array.isArray(source)) return source;
	if (!source) return [];
	return source.split("\n").map((line, idx, arr) => {
		// Keep newlines except after the last line
		return idx === arr.length - 1 ? line : `${line}\n`;
	});
};

/**
 * Convert SEMOSS notebook format to Jupyter .ipynb format.
 * Derives notebook-level metadata (kernelspec, language_info) from the
 * first code cell's language, so the output is correct for Python, R, or SQL.
 */
export const semossToIpynb = (semoss: SemossNotebook): JupyterNotebook => {
	const cells: JupyterCell[] = [];
	let firstCodeLang = "py";

	// Extract cells from the first (and usually only) query
	const queryIds = Object.keys(semoss.queries ?? {});
	if (queryIds.length > 0) {
		const firstQuery = semoss.queries[queryIds[0]];
		if (firstQuery && Array.isArray(firstQuery.cells)) {
			for (const cell of firstQuery.cells) {
				// Capture the first code cell's language for notebook metadata
				if (
					firstCodeLang === "py" &&
					(cell.widget ?? "").toLowerCase() === "code"
				) {
					firstCodeLang = (cell.parameters?.type as string) ?? "py";
				}
				const jupyterCell = convertSemossCellToJupyter(cell);
				if (jupyterCell) {
					cells.push(jupyterCell);
				}
			}
		}
	}

	const langLower = firstCodeLang.toLowerCase();
	const metaName =
		langLower === "r" ? "r" : langLower === "sql" ? "sql" : "python";
	const kernelspec =
		langLower === "r"
			? { display_name: "R", language: "R", name: "ir" }
			: { display_name: "Python 3", language: "python", name: "python3" };

	return {
		nbformat: 4,
		nbformat_minor: 4,
		metadata: { kernelspec, language_info: { name: metaName } },
		cells,
	};
};

/**
 * Convert a single SEMOSS cell to Jupyter cell format
 */
const convertSemossCellToJupyter = (cell: SemossCell): JupyterCell | null => {
	const widget = cell.widget?.toLowerCase() ?? "";
	const params = cell.parameters ?? {};

	// Handle code cells
	if (widget === "code") {
		const code = (params.code as string) ?? "";
		const type = (params.type as string)?.toLowerCase() ?? "py";
		const language = toJupyterLanguage(type);

		return {
			cell_type: "code",
			execution_count: null,
			metadata: {
				language: language,
			},
			outputs: [],
			source: normalizeSource(code),
		};
	}

	// Handle markdown cells
	if (widget === "markdown" || params.type === "markdown") {
		const code = (params.code as string) ?? "";
		return {
			cell_type: "markdown",
			metadata: {},
			source: normalizeSource(code),
		};
	}

	// Skip SEMOSS-specific cells (llm, mcp-tool, transformations, etc.)
	// These don't have direct .ipynb equivalents
	return null;
};

/**
 * Serialize a live StateStore notebook to a .ipynb JSON string,
 * preserving real execution_count and outputs captured at runtime.
 * `existingIpynb` is used only to retain the saved metadata block
 * (kernelspec, language_info, nbformat versions).
 */
export const stateToIpynb = (
	notebook: LiveNotebookState,
	existingIpynb: JupyterNotebook,
): string => {
	// Backward-compatible fallback: infer sequential counts if callers do not
	// provide explicit executionCount values.
	let executionCounter = 0;

	const cells: JupyterCell[] = notebook.list
		.map((cellId, cellIndex) => {
			const cell = notebook.cells[cellId];
			if (!cell) return null;

			const widget = (cell.widget ?? "").toLowerCase();
			const params = cell.parameters ?? {};
			const code = (params.code as string) ?? "";
			const langRaw = (params.type as string) ?? "py";
			const language = toJupyterLanguage(langRaw);

			if (widget === "markdown") {
				return {
					cell_type: "markdown" as const,
					metadata: { language: "markdown" },
					source: normalizeSource(code),
				};
			}

			if (widget === "code") {
				const existingCell = existingIpynb.cells?.[cellIndex];
				const existingCodeCell =
					existingCell && existingCell.cell_type === "code"
						? existingCell
						: null;

				const outputs: JupyterCellOutput[] = existingCodeCell?.outputs
					? [...existingCodeCell.outputs]
					: [];
				const providedExecutionCount =
					typeof cell.executionCount === "number"
						? cell.executionCount
						: null;
				const existingExecutionCount =
					typeof existingCodeCell?.execution_count === "number"
						? existingCodeCell.execution_count
						: null;

				if (cell.isExecuted) {
					outputs.length = 0;

					if (providedExecutionCount === null) {
						executionCounter++;
					}

					if (cell.isError) {
						outputs.push({
							output_type: "stream",
							name: "stderr",
							text: normalizeSource(
								typeof cell.output === "string"
									? cell.output
									: JSON.stringify(cell.output),
							),
						});
					} else if (
						cell.output !== undefined &&
						cell.output !== null
					) {
						const text =
							typeof cell.output === "string"
								? cell.output
								: JSON.stringify(cell.output, null, 2);

						if (text.trim()) {
							outputs.push({
								output_type: "stream",
								name: "stdout",
								text: normalizeSource(text),
							});
						}
					}

					if (cell.messages && cell.messages.length > 0) {
						const joined = cell.messages.join("");
						if (joined.trim()) {
							outputs.unshift({
								output_type: "stream",
								name: "stdout",
								text: normalizeSource(joined),
							});
						}
					}
				}

				return {
					cell_type: "code" as const,
					execution_count:
						providedExecutionCount ??
						existingExecutionCount ??
						(cell.isExecuted ? executionCounter : null),
					metadata: { language },
					outputs: outputs as JupyterCellOutput[],
					source: normalizeSource(code),
				};
			}

			// Non-renderable SEMOSS cell types: skip
			return null;
		})
		.filter((c): c is NonNullable<typeof c> => c !== null) as JupyterCell[];

	return JSON.stringify(
		{
			nbformat: existingIpynb.nbformat ?? 4,
			nbformat_minor: existingIpynb.nbformat_minor ?? 4,
			metadata: existingIpynb.metadata,
			cells,
		},
		null,
		2,
	);
};

/**
 * Convert Jupyter .ipynb format back to SEMOSS notebook format (for loading)
 */
export const ipynbToSemoss = (ipynb: JupyterNotebook): SemossNotebook => {
	const cells: SemossCell[] = [];
	let cellIdCounter = 1;

	for (const cell of ipynb.cells ?? []) {
		if (cell.cell_type === "code") {
			const source = Array.isArray(cell.source)
				? cell.source.join("")
				: (cell.source ?? "");

			// Detect language from cell metadata or default to Python
			let cellType = "py";
			if (
				cell.metadata &&
				typeof cell.metadata === "object" &&
				"language" in cell.metadata
			) {
				const lang = cell.metadata.language as string;
				if (lang.toLowerCase() === "r") {
					cellType = "r";
				} else if (lang.toLowerCase() === "sql") {
					cellType = "sql";
				}
			}

			cells.push({
				id: String(cellIdCounter),
				widget: "code",
				parameters: {
					code: source,
					type: cellType,
				},
			});
			cellIdCounter++;
		} else if (cell.cell_type === "markdown") {
			const source = Array.isArray(cell.source)
				? cell.source.join("")
				: (cell.source ?? "");

			cells.push({
				id: String(cellIdCounter),
				widget: "markdown",
				parameters: {
					code: source,
					type: "markdown",
				},
			});
			cellIdCounter++;
		}
		// Skip raw cells and unsupported types
	}

	return {
		version: "1",
		queries: {
			"notebook 1": {
				id: "notebook 1",
				cells,
			},
		},
		blocks: {},
		variables: {},
		executionOrder: [],
	};
};

/**
 * Append a code cell to an existing .ipynb format JSON string
 * Returns updated JSON string, or null if parsing fails
 */
export const appendCellToIpynb = (
	existingIpynbJson: string,
	code: string,
	lang: string,
): string | null => {
	try {
		const ipynb = JSON.parse(existingIpynbJson) as JupyterNotebook;
		const language = toJupyterLanguage(lang);

		const newCell: JupyterCell = {
			cell_type: "code",
			execution_count: null,
			metadata: {
				language,
			},
			outputs: [],
			source: normalizeSource(code),
		};

		if (!Array.isArray(ipynb.cells)) {
			ipynb.cells = [];
		}

		ipynb.cells.push(newCell);

		return JSON.stringify(ipynb, null, 2);
	} catch {
		return null;
	}
};

/**
 * Replace a specific cell in .ipynb format by index
 * Returns updated JSON string, or null if the cell index is invalid
 */
export const replaceCellInIpynb = (
	existingIpynbJson: string,
	cellIndex: number,
	code: string,
	lang: string,
): string | null => {
	try {
		const ipynb = JSON.parse(existingIpynbJson) as JupyterNotebook;

		if (
			!Array.isArray(ipynb.cells) ||
			cellIndex < 0 ||
			cellIndex >= ipynb.cells.length
		) {
			return null;
		}

		const language = toJupyterLanguage(lang);

		// Replace the cell while preserving execution_count and outputs for now
		const existingCell = ipynb.cells[cellIndex];
		ipynb.cells[cellIndex] = {
			cell_type: "code",
			execution_count:
				existingCell && existingCell.cell_type === "code"
					? existingCell.execution_count
					: null,
			metadata: {
				language,
			},
			outputs: [],
			source: normalizeSource(code),
		};

		return JSON.stringify(ipynb, null, 2);
	} catch {
		return null;
	}
};

/**
 * Check if a string is valid .ipynb JSON
 */
export const isValidIpynb = (content: string): boolean => {
	try {
		const parsed = JSON.parse(content) as unknown;
		if (typeof parsed !== "object" || parsed === null) return false;
		const notebook = parsed as Record<string, unknown>;
		return notebook.nbformat === 4 && Array.isArray(notebook.cells);
	} catch {
		return false;
	}
};

/**
 * Check if a string is valid SEMOSS notebook JSON
 */
export const isValidSemossNotebook = (content: string): boolean => {
	try {
		const parsed = JSON.parse(content) as unknown;
		if (typeof parsed !== "object" || parsed === null) return false;
		const notebook = parsed as Record<string, unknown>;
		return notebook.version === "1" && typeof notebook.queries === "object";
	} catch {
		return false;
	}
};
