// Public surface of the notebook editor: the top-level component, plus the
// nbformat types/helpers external callers (e.g. chat's "Add to Notebook")
// need to build/append cells using the same single source of truth as the
// live Notebook editor. Everything else (subcomponents) stays internal.
export { Notebook } from "./notebook";
export type {
	CellType,
	JupyterCell,
	JupyterCodeCell,
	JupyterNotebook,
	JupyterOutput,
	RunCellResult,
} from "./notebook.utility";
export {
	buildChatExecutionOutputs,
	createCodeCellFromExecution,
	createEmptyNotebook,
	createNotebookFilePath,
	insertCell,
	nextExecutionCount,
	normalizeSource,
	parseNotebook,
	unwrapPixelOutput,
} from "./notebook.utility";
export { notifyNotebookFileRefresh } from "./notebook-events";
