/**
 * Built-in reactor inventory at Semoss 12781b2478eb97e2a27a911e9bdbc94b6f34ee88.
 * Named keys include inherited constructors and reachable execution/helper reads.
 * Required inputs are included where reachable organizeKeys/checkOptional enforces
 * them. Output shapes follow source values and PixelStreamUtility. Remaining value,
 * validation, and nested-shape gaps are explicit in contract-gaps.json; audited
 * contracts override these base contracts in catalog.ts.
 */
import type { SourceParameters } from "./source-parameters";
import type { ReactorContract } from "./value-types";

export interface PlaywrightReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/playwright/AddVisionContextReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddVisionContext: ReactorContract<
		SourceParameters<"visionContext", "both", ["visionContext"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/CheckNetworkIdleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckNetworkIdle: ReactorContract<
		SourceParameters<
			"quietMillis" | "sessionId" | "tabId",
			"both",
			["sessionId", "tabId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/DeleteStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteStep: ReactorContract<
		SourceParameters<
			"sessionId" | "stepId" | "tabId",
			"both",
			["sessionId", "tabId", "stepId"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/DeleteTabReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteTab: ReactorContract<
		SourceParameters<
			"sessionId" | "tabId",
			"both",
			["sessionId", "tabId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ExtractElementsDataForLLMReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExtractElementsDataForLLM: ReactorContract<
		SourceParameters<
			"paramValues" | "sessionId" | "tabId",
			"both",
			["sessionId", "tabId", "paramValues"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/FindPlaywrightRoomRecordingsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FindPlaywrightRoomRecordings: ReactorContract<
		SourceParameters<"max_candidates" | "query", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GenerateInputDescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateInputDescription: ReactorContract<
		SourceParameters<
			"engine" | "selector" | "sessionId" | "tabId",
			"both",
			["engine", "sessionId", "selector", "tabId"],
			4
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GenerateInputValuesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateInputValues: ReactorContract<
		SourceParameters<
			| "engine"
			| "limit"
			| "offset"
			| "paramValues"
			| "roomId"
			| "sessionId"
			| "sortOrder",
			"both",
			["engine", "sessionId", "paramValues"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightAutomationGoalReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GeneratePlaywrightAutomationGoal: ReactorContract<
		SourceParameters<"engine" | "limit" | "roomId", "both", ["roomId"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightFieldActionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GeneratePlaywrightFieldActions: ReactorContract<
		SourceParameters<
			"engine" | "limit" | "roomId" | "sessionId" | "x" | "y",
			"both",
			["roomId", "sessionId"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightRecordingMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GeneratePlaywrightRecordingMetadata: ReactorContract<
		SourceParameters<
			"engine" | "limit" | "recording_name_hint" | "roomId" | "sessionId",
			"both",
			["sessionId"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightStepsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GeneratePlaywrightSteps: ReactorContract<
		SourceParameters<
			"engine" | "paramValues" | "roomId" | "sessionId",
			"both",
			["engine", "sessionId", "paramValues"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GetAllStepsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAllSteps: ReactorContract<
		SourceParameters<
			"fileName" | "project" | "sessionId",
			"both",
			["project", "sessionId", "fileName"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GetAllStepsWithoutSessionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAllStepsWithoutSession: ReactorContract<
		SourceParameters<
			"fileName" | "project",
			"both",
			["project", "fileName"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GetPlaywrightScriptVariablesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPlaywrightScriptVariables: ReactorContract<
		SourceParameters<
			"Script" | "project",
			"both",
			["project", "Script"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/GetRoomConversationHistoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRoomConversationHistory: ReactorContract<
		SourceParameters<
			"includePartial" | "limit" | "offset" | "roomId" | "sort",
			"both",
			["roomId"],
			1
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ImageContextReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ImageContext: ReactorContract<
		SourceParameters<
			"engine" | "paramValues" | "sessionId" | "tabId",
			"both",
			["sessionId", "tabId", "engine"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ListPlaywrightScriptsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListPlaywrightScripts: ReactorContract<
		SourceParameters<"project", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/MakePlaywrightMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakePlaywrightMCP: ReactorContract<
		SourceParameters<"comment" | "project", "both", ["project"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/MakeRoomPlaywrightMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeRoomPlaywrightMCP: ReactorContract<
		SourceParameters<"roomId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/OpenPlaywrightSocketsRoomRecordingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenPlaywrightSocketsRoomRecording: ReactorContract<
		SourceParameters<
			"recording_name_hint" | "start_url",
			"both",
			["start_url"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/PatchFileMetaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PatchFileMeta: ReactorContract<
		SourceParameters<
			"name" | "paramValues" | "project",
			"both",
			["name", "paramValues"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/PatchSessionMetaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PatchSessionMeta: ReactorContract<
		SourceParameters<
			"paramValues" | "sessionId",
			"both",
			["sessionId", "paramValues"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/PlanNextPlaywrightActionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PlanNextPlaywrightAction: ReactorContract<
		SourceParameters<
			| "engine"
			| "goal"
			| "history"
			| "iteration"
			| "limit"
			| "maxIterations"
			| "roomId"
			| "sessionId",
			"both",
			["roomId", "sessionId"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/PlayPlaywrightSocketsRoomRecordingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PlayPlaywrightSocketsRoomRecording: ReactorContract<
		SourceParameters<
			| "project_id"
			| "recording_file"
			| "recording_name_hint"
			| "start_url",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ProbeElementReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ProbeElement: ReactorContract<
		SourceParameters<
			"coords" | "sessionId" | "tabId",
			"both",
			["sessionId", "coords"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ReplaySingleStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplaySingleStep: ReactorContract<
		SourceParameters<
			| "fileName"
			| "paramValues"
			| "project"
			| "sessionId"
			| "stepId"
			| "tabId",
			"both",
			["project", "sessionId", "fileName", "stepId"],
			5
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ReplayStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReplayStep: ReactorContract<
		SourceParameters<
			| "executeAll"
			| "fileName"
			| "paramValues"
			| "project"
			| "sessionId"
			| "tabId",
			"both",
			["sessionId", "fileName", "project"],
			6
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ResolvePlaywrightRoomRecordingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResolvePlaywrightRoomRecording: ReactorContract<
		SourceParameters<
			"project_id" | "recording_file" | "recording_name_hint" | "roomId",
			"both",
			["roomId"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/SaveAllReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveAll: ReactorContract<
		SourceParameters<
			| "description"
			| "intent"
			| "name"
			| "project"
			| "sessionId"
			| "title",
			"both",
			["project", "sessionId", "name"],
			3
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/ScreenshotReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Screenshot: ReactorContract<
		SourceParameters<
			"paramValues" | "sessionId" | "tabId",
			"both",
			["sessionId", "tabId"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/SessionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Session: ReactorContract<
		SourceParameters<never, "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/SkipStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SkipStep: ReactorContract<
		SourceParameters<
			"fileName" | "project" | "sessionId" | "tabId",
			"both",
			["project", "sessionId", "fileName"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/StepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Step: ReactorContract<
		SourceParameters<
			| "pageIndex"
			| "paramValues"
			| "sessionId"
			| "shouldStore"
			| "stepIndex"
			| "tabId",
			"both",
			["sessionId", "tabId", "paramValues"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/UpdatePlaywrightScriptVariablesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdatePlaywrightScriptVariables: ReactorContract<
		SourceParameters<
			"OutputScript" | "Script" | "Variables" | "project",
			"both",
			["Script", "Variables", "project"],
			4
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/playwright/UpdateStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateStep: ReactorContract<
		SourceParameters<
			"inputs" | "sessionId" | "tabId",
			"both",
			["sessionId", "tabId", "inputs"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
}
