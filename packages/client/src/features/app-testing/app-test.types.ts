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
}

/** A recording remains separate from the app's published files. */
export interface AppTestRecording {
	id: string;
	name: string;
	/** The workflow and expected behavior this test verifies. */
	description: string;
	/** A required database profile; removing it must never turn this into a production test. */
	engineTestConfigurationId?: string;
	startPath: string;
	steps: AppTestStep[];
	version: number;
	updatedAt: string;
}

/** Unsaved browser actions and explicit outcome checks. */
export type AppTestDraft = Pick<
	AppTestRecording,
	"name" | "description" | "startPath" | "steps" | "engineTestConfigurationId"
>;

/** App-owned mappings used only by test recording/replay contexts. */
export interface EngineTestConfiguration {
	id: string;
	version: number;
	name: string;
	mappings: { realEngineId: string; testEngineId: string }[];
	denyUnmappedDatabases: boolean;
	updatedAt: string;
}

/** Ephemeral browser routing handle. Never save sessionToken in a test definition. */
export interface AppTestSession {
	target: string;
	sessionToken: string;
	configurationId: string;
	expiresAt: string;
}

/** The subset of the runner report displayed in the app viewer. */
export interface AppTestRun {
	runId: string;
	target: string;
	status: string;
	scope?: string;
	coverageWarning?: string;
	summary?: Record<string, number>;
	error?: string;
	databaseMode?: string;
	engineTestConfiguration?: {
		configurationId: string;
		mappings: Record<string, string>;
	};
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
