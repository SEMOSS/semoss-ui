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
	historyWarning?: string;
	reportWarning?: string;
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

/** Compact, project-visible result; private page evidence is deliberately excluded. */
export interface AppTestHistoryResult {
	id: string;
	name: string;
	status: string;
	steps: number;
	stepsAttempted: number;
	stepsCompleted: number;
	assertions: number;
	assertionsPassed: number;
	durationMs?: number;
	definitionHash?: string;
	classification?: string;
	reason?: string;
	failedStep?: number;
	startedAt?: string;
	finishedAt?: string;
	repeats?: number;
	passedRepeats?: number;
}

/** Latest result for a test UUID, independent of the definition's current name. */
export interface AppTestLatestResult extends AppTestHistoryResult {
	runId: string;
	startedAt: string;
}

/** One history-list row; per-test filters include that test's compact counters. */
export interface AppTestRunSummary {
	runId: string;
	status: string;
	startedAt: string;
	finishedAt?: string;
	durationMs?: number;
	test?: AppTestLatestResult;
}

/** A bounded history page; definitions and detailed browser evidence are never listed. */
export interface AppTestRunHistoryPage {
	target: string;
	runs: AppTestRunSummary[];
	latest: AppTestLatestResult[];
	total: number;
	offset: number;
	hasMore: boolean;
	retainedRuns: number;
}

/** One persisted run loaded on demand, potentially filtered to one test. */
export interface AppTestRunHistory {
	runId: string;
	target: string;
	status: string;
	startedAt: string;
	finishedAt?: string;
	durationMs?: number;
	tests: AppTestHistoryResult[];
}
