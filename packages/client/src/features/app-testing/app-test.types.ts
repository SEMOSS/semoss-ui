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
	/** For ASSERT_TEXT: the element's whole text must equal `text`, not just contain it. */
	exact?: boolean;
	x?: number;
	y?: number;
	path?: string;
	/** App-relative top-level URL expected before this action, including query/hash routes. */
	pagePath?: string;
}

/** A declarative JSON file under the app's non-public assets/app-tests/tests. */
export interface AppTestRecording {
	id: string;
	name: string;
	/** The workflow and expected behavior this test verifies. */
	description: string;
	startPath: string;
	steps: AppTestStep[];
	version: number;
	updatedAt: string;
}

/** Small discovery payload; full test steps are fetched individually. */
export type AppTestRecordingSummary = Pick<
	AppTestRecording,
	"id" | "name" | "description"
>;

/** Unsaved browser actions and explicit outcome checks. */
export type AppTestDraft = Pick<
	AppTestRecording,
	"name" | "description" | "startPath" | "steps"
> & { id?: string };

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
		description?: string;
		status: string;
		reason?: string;
		classification?: string;
		repeats?: number;
		passedRepeats?: number;
	}[];
}
