/** Browser operations understood by the platform app-test runner. */
export interface AppTestStep {
	type:
		| "CLICK"
		| "FILL"
		| "SELECT"
		| "CHECK"
		| "KEY"
		| "SCROLL"
		| "ASSERT_TEXT"
		| "ASSERT_VISIBLE"
		| "NAVIGATE";
	selector?: string;
	/** Selectors of nested frames, relative to the app document. */
	framePath?: string[];
	value?: string;
	checked?: boolean;
	key?: string;
	text?: string;
	x?: number;
	y?: number;
	path?: string;
}

/** A recording remains separate from the app's published files. */
export interface AppTestRecording {
	id: string;
	name: string;
	startPath: string;
	steps: AppTestStep[];
	version: number;
	updatedAt: string;
}

/** Unsaved browser actions and explicit outcome checks. */
export type AppTestDraft = Pick<
	AppTestRecording,
	"name" | "startPath" | "steps"
>;

/** The subset of the runner report displayed in the app viewer. */
export interface AppTestRun {
	runId: string;
	target: string;
	status: string;
	scope?: string;
	coverageWarning?: string;
	summary?: Record<string, number>;
	error?: string;
	tests?: {
		name: string;
		status: string;
		reason?: string;
		classification?: string;
	}[];
}
