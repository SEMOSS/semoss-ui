/**
 * Minimal, self-contained nbformat (Jupyter .ipynb) types. A lightweight,
 * dependency-free local model instead of a heavier renderer's types, so we do
 * not pull those into `@semoss/shared`.
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
export type JupyterCellType = JupyterCell["cell_type"];

export interface JupyterNotebook {
	nbformat: number;
	nbformat_minor: number;
	metadata: Record<string, unknown>;
	cells: JupyterCell[];
}
