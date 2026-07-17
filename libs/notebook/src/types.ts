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
		[key: string]: unknown;
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
	| JupyterUpdateDisplayDataOutput
	| JupyterErrorOutput;

export interface JupyterStreamOutput {
	output_type: "stream";
	name: "stdout" | "stderr";
	text: string | string[];
}

export interface JupyterDisplayDataOutput {
	output_type: "display_data";
	data: Record<string, unknown>;
	metadata: Record<string, unknown>;
}

export interface JupyterExecuteResultOutput {
	output_type: "execute_result";
	data: Record<string, unknown>;
	metadata: Record<string, unknown>;
	execution_count: number | null;
}

export interface JupyterUpdateDisplayDataOutput {
	output_type: "update_display_data";
	data: Record<string, unknown>;
	metadata: Record<string, unknown>;
	transient?: Record<string, unknown>;
}

export interface JupyterErrorOutput {
	output_type: "error";
	ename: string;
	evalue: string;
	traceback: string[];
}

export interface NotebookExecutionData {
	executionCount?: number | null;
	outputs?: JupyterCellOutput[];
}

export interface NotebookExecutionResultInput {
	output: string;
	logs: string[];
	isError: boolean;
	pending: boolean;
	rawOutput?: unknown;
}

export interface NotebookMetadataData {
	languageVersion?: string;
}

export interface IpynbRowSelection {
	insightId: string;
	path: string;
	queryId: string;
	cellId: string;
	rowNumber: number;
	cellType?: string;
	code?: string;
}

export interface RunIpynbCellRequest {
	notebook: JupyterNotebook;
	path: string;
	cellIndex: number;
	cell: JupyterCodeCell;
}

export interface RunIpynbCellResult {
	outputs: JupyterCellOutput[];
	executionCount?: number | null;
}
