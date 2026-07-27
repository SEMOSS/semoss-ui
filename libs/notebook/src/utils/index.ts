// Public surface of the notebook utils module - re-exports each split file's
// function(s) under the same names the old single utils.ts file exported, so
// nothing outside this folder needs to know about the internal file layout.

export { appendCellToNotebook } from "./append-cell";
export { createNotebookFileContent } from "./create-notebook-content";
export { buildExecutePixel } from "./execute-pixel";
export { getNextNotebookExecutionCount } from "./execution-count";
export { toNotebookExecutionData } from "./execution-data";
export {
	buildNotebookExecutionSource,
	isPythonCellLanguage,
} from "./execution-source";
export { extractNotebookInlineDisplayOutputsFromLogs } from "./extract-display-outputs";
export { createNotebookFilePath } from "./file-path";
export type {
	NotebookCellExecutionOutcome,
	NotebookConsoleResult,
} from "./map-console-result";
export { mapNotebookConsoleResultToOutputs } from "./map-console-result";
export { resolveMarkdownAttachments } from "./markdown-attachments";
export { parseNotebookJson } from "./parse-notebook";
export type { PreparedCellExecution } from "./prepare-cell-execution";
export { prepareNotebookCellExecution } from "./prepare-cell-execution";
export { replaceNotebookCell } from "./replace-cell";
export { runtimeOutputToJupyterOutputs } from "./runtime-output";
export { normalizeSource } from "./source";
export type { TruncatedText } from "./text-truncation";
export {
	MAX_TEXT_OUTPUT_LENGTH,
	truncateTextOutput,
} from "./text-truncation";
export { unwrapPixelOutput } from "./unwrap-pixel-output";
export { updateNotebookCellExecution } from "./update-cell-execution";
