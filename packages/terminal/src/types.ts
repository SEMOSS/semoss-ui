export type TerminalLocation = "workspace" | "panel" | "popup" | "pipeline";

/**
 * The scope a file lives in — passed verbatim to `<FileExplorer mode>` and
 * `<FileEditor mode>`. Mirrors the shape exported from
 * `libs/shared/src/components/file/file.types.ts`; declared locally so we
 * don't have to deep-import from that path.
 */
export type FileMode =
	| { type: "INSIGHT"; insightId?: string }
	| { type: "APP"; app: string }
	| { type: "ENGINE"; engine: string }
	| { type: "STORAGE"; storage: string }
	| { type: "USER" };

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
