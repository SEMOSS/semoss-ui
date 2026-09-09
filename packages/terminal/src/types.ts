export type TerminalLocation = "workspace" | "panel" | "popup" | "pipeline";

/**
 * The scope a file lives in — passed verbatim to `useFileExplorer` and
 * `<FileEditor mode>`. Re-exported rather than redeclared so the two can never
 * drift.
 */
export type { FileMode } from "@semoss/shared";

export interface AppRef {
	project_id: string;
	project_name: string;
	description?: string;
}

export type TerminalMode = "repl" | "editor" | "asset";

export type TerminalView = "inline" | "overlay" | "side" | "popup";

export type ConsoleContext = "Pixel" | "R" | "Python" | "Shell";

export interface SelectedFile {
	name: string;
	path: string;
	date: string;
	split: string[];
	content: string;
	open: boolean;
	history: HistoryStep[];
	new: boolean;
	space: string;
	updated: string;
	ext: string;
	selectedPath?: string;
}

export interface ConsoleHistoryStep {
	/** Monotonic id assigned when the step is appended; used as the React key. */
	id: string;
	executed: boolean;
	expression: string;
	type: string;
	context: ConsoleContext | string;
	input: string;
	output: string;
	/** stdout / stderr lines pulled while the async pixel job was running. */
	messages?: string[];
	/** Last status string from `getPixelConsole` (e.g. "ProgressComplete"). */
	lastStatus?: string;
	/** True while the job is still polling. */
	pending?: boolean;
}

export interface HistoryStep {
	message: string;
	user: string;
	date: string;
	id?: string;
}

export interface ConsoleState {
	context: ConsoleContext;
	rawOutput: boolean;
	maxRecords: number;
	executeOnEnter: boolean;
	wordWrap: boolean;
}

export interface PixelReturn<O = unknown> {
	output: O;
	operationType: string[];
}
