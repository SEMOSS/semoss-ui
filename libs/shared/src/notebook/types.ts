/**
 * Jupyter Notebook (.ipynb) format types
 * Reference: https://jupyter.org/enhancement-proposals/62-notebook-4.5-format/notebook-4.5-format.rst
 */

export interface JupyterNotebook {
	nbformat: 4;
	nbformat_minor: number;
	metadata: JupyterNotebookMetadata;
	cells: JupyterCell[];
}

export interface JupyterNotebookMetadata {
	kernelspec?: {
		display_name: string;
		language: string;
		name: string;
	};
	language_info?: {
		name: string;
		version?: string;
	};
	[key: string]: unknown;
}

export type JupyterCell =
	| JupyterCodeCell
	| JupyterMarkdownCell
	| JupyterRawCell;

export interface JupyterCodeCell {
	cell_type: "code";
	execution_count: number | null;
	metadata: Record<string, unknown>;
	outputs: JupyterCellOutput[];
	source: string | string[];
}

export interface JupyterMarkdownCell {
	cell_type: "markdown";
	metadata: Record<string, unknown>;
	source: string | string[];
}

export interface JupyterRawCell {
	cell_type: "raw";
	metadata: Record<string, unknown>;
	source: string | string[];
}

export type JupyterCellOutput =
	| JupyterStreamOutput
	| JupyterDisplayDataOutput
	| JupyterExecuteResultOutput
	| JupyterErrorOutput;

export interface JupyterStreamOutput {
	output_type: "stream";
	name: "stdout" | "stderr";
	text: string | string[];
}

export interface JupyterDisplayDataOutput {
	output_type: "display_data";
	metadata: Record<string, unknown>;
	data: Record<string, unknown>;
}

export interface JupyterExecuteResultOutput {
	output_type: "execute_result";
	execution_count: number;
	metadata: Record<string, unknown>;
	data: Record<string, unknown>;
}

export interface JupyterErrorOutput {
	output_type: "error";
	ename: string;
	evalue: string;
	traceback: string[];
}

/**
 * SEMOSS Notebook format (internal)
 */
export interface SemossNotebook {
	version: "1";
	queries: Record<
		string,
		{
			id: string;
			cells: SemossCell[];
		}
	>;
	blocks: Record<string, unknown>;
	variables: Record<string, unknown>;
	executionOrder: unknown[];
}

export interface SemossCell {
	id: string;
	widget: string;
	parameters: Record<string, unknown>;
}
