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

export interface AutomationReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/automation/definition/AddAutomationStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddAutomationStep: ReactorContract<
		SourceParameters<
			| "afterNodeId"
			| "branchPort"
			| "config"
			| "label"
			| "nodeType"
			| "outputVar"
			| "project",
			"both",
			["project", "nodeType", "config", "label"],
			4
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/CancelAutomationRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CancelAutomationRun: ReactorContract<
		SourceParameters<"project" | "runId", "both", ["runId"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/project/CreateAutomationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateAutomation: ReactorContract<
		SourceParameters<"projectName", "both", ["projectName"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/definition/GetAutomationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAutomation: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/agent/GetAutomationAgentRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAutomationAgentRun: ReactorContract<
		SourceParameters<
			| "agentRunId"
			| "automationRunId"
			| "includeMessages"
			| "nodeId"
			| "project",
			"both",
			["automationRunId", "nodeId", "agentRunId"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/definition/GetAutomationNodeDefinitionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAutomationNodeDefinitions: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/GetAutomationResultReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAutomationResult: ReactorContract<
		SourceParameters<
			"limit" | "offset" | "project" | "resultId",
			"both",
			["project", "resultId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/GetAutomationRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAutomationRun: ReactorContract<
		SourceParameters<"project" | "runId", "both", ["runId"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/GetAutomationRunSourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAutomationRunSource: ReactorContract<
		SourceParameters<
			"nodeId" | "project" | "runId",
			"both",
			["runId", "nodeId"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/ListAutomationRunsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListAutomationRuns: ReactorContract<
		SourceParameters<"limit" | "project", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/OpenAutomationResultReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenAutomationResult: ReactorContract<
		SourceParameters<
			"project" | "resultId" | "variable",
			"both",
			["project", "resultId"],
			2
		>,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/definition/RemoveAutomationStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveAutomationStep: ReactorContract<
		SourceParameters<
			"nodeId" | "project" | "removeDownstream",
			"both",
			["project", "nodeId"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/agent/ResolveAutomationAgentRunActionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResolveAutomationAgentRunAction: ReactorContract<
		SourceParameters<
			| "actionId"
			| "agentRunId"
			| "automationRunId"
			| "decision"
			| "mcpToolResult"
			| "mcpToolStatus"
			| "nodeId"
			| "paramValues"
			| "project",
			"both",
			["automationRunId", "nodeId", "agentRunId", "actionId", "decision"],
			6
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/ResumeAutomationRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResumeAutomationRun: ReactorContract<
		SourceParameters<"project" | "runId", "both", ["runId"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/RunAutomationDefinitionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunAutomationDefinition: ReactorContract<
		SourceParameters<
			"inputs" | "json" | "nodeSources" | "triggerType",
			"both",
			["json"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/definition/SaveAutomationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveAutomation: ReactorContract<
		SourceParameters<
			"expectedRevision" | "json" | "nodeSources" | "project",
			"both",
			["project", "json"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/agent/StopAutomationAgentRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	StopAutomationAgentRun: ReactorContract<
		SourceParameters<
			"agentRunId" | "automationRunId" | "nodeId" | "project",
			"both",
			["automationRunId", "nodeId", "agentRunId"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/run/TriggerAutomationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TriggerAutomation: ReactorContract<
		SourceParameters<
			"inputs" | "project" | "triggerType",
			"both",
			["project"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/definition/UpdateAutomationCustomStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateAutomationCustomStep: ReactorContract<
		SourceParameters<
			"expectedSourceHash" | "nodeId" | "project" | "source",
			"both",
			["project", "nodeId", "source", "expectedSourceHash"],
			4
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/automation/definition/UpdateAutomationStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateAutomationStep: ReactorContract<
		SourceParameters<
			"config" | "label" | "nodeId" | "project",
			"both",
			["project", "nodeId", "config"],
			3
		>,
		unknown,
		false
	>;
}
