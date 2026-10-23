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

export interface AgentReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/agent/metrics/AssessAgentEffectivenessReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AssessAgentEffectiveness: ReactorContract<
		SourceParameters<
			"focus" | "judgeModelId" | "maxTranscriptChars" | "runId",
			"both",
			["runId"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/AttachSkillToWorkspaceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AttachSkillToWorkspace: ReactorContract<
		SourceParameters<
			"skillId" | "workspaceId",
			"both",
			["workspaceId", "skillId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/subagent/CheckSubAgentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckSubAgent: ReactorContract<
		SourceParameters<"jobId", "both", ["jobId"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/CloneSkillReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CloneSkill: ReactorContract<
		SourceParameters<"name" | "skillId", "both", ["skillId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/CreateSkillReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateSkill: ReactorContract<
		SourceParameters<
			"description" | "name" | "skillContent",
			"both",
			["skillContent"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/DeclineDelegationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeclineDelegation: ReactorContract<
		SourceParameters<"actionId" | "reason", "both", ["actionId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/DeleteFunctionsInMCPDriverReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteFunctionsInMCPDriver: ReactorContract<
		SourceParameters<
			"engine" | "functionName" | "project",
			"both",
			["engine" | "project", "functionName"],
			2
		>,
		Record<string, unknown> | boolean | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/DeleteSkillReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteSkill: ReactorContract<
		SourceParameters<"skillId", "both", ["skillId"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/DetachSkillFromWorkspaceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DetachSkillFromWorkspace: ReactorContract<
		SourceParameters<
			"skillId" | "workspaceId",
			"both",
			["workspaceId", "skillId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetAgentActivityLogReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAgentActivityLog: ReactorContract<
		SourceParameters<
			"agentId" | "limit" | "offset" | "sortByRoom",
			"both",
			["agentId"],
			1
		>,
		Record<string, unknown> | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/metrics/GetAgentEffectivenessReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAgentEffectiveness: ReactorContract<
		SourceParameters<"includeRuns" | "limit" | "roomId" | "runId", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetAgentRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAgentRun: ReactorContract<
		SourceParameters<"includeMessages" | "runId", "both", ["runId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetAgentRunActionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAgentRunAction: ReactorContract<
		SourceParameters<"actionId", "both", ["actionId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetAgentRunsForRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAgentRunsForRoom: ReactorContract<
		SourceParameters<"includeMessages" | "roomId", "both", ["roomId"], 1>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetAssignedDelegationsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAssignedDelegations: ReactorContract<
		SourceParameters<"status", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetClaudeCodeTranscriptHistoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetClaudeCodeTranscriptHistory: ReactorContract<
		SourceParameters<"roomId", "both", ["roomId"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/GetFunctionsInMCPDriverReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFunctionsInMCPDriver: ReactorContract<
		SourceParameters<
			"engine" | "project",
			"both",
			["engine" | "project"],
			1
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetGitHubCopilotTranscriptHistoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetGitHubCopilotTranscriptHistory: ReactorContract<
		SourceParameters<"roomId", "both", ["roomId"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/GetMCPPromptsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetMCPPrompts: ReactorContract<
		SourceParameters<
			"engine" | "project",
			"both",
			["engine" | "project"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/GetMCPResourcesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetMCPResources: ReactorContract<
		SourceParameters<
			"engine" | "project",
			"both",
			["engine" | "project"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/GetMCPResourcesTemplatesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetMCPResourcesTemplates: ReactorContract<
		SourceParameters<
			"engine" | "project",
			"both",
			["engine" | "project"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/GetMCPToolsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetMCPTools: ReactorContract<
		SourceParameters<
			"engine" | "project",
			"both",
			["engine" | "project"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/GetSubagentRunsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetSubagentRuns: ReactorContract<
		SourceParameters<"runId", "both", ["runId"], 1>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/InitMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	InitMCP: ReactorContract<
		SourceParameters<
			"engine" | "project" | "protocolVersion",
			"both",
			["engine" | "project", "protocolVersion"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/ListSkillFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListSkillFiles: ReactorContract<
		SourceParameters<"project", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/ListSkillsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListSkills: ReactorContract<
		SourceParameters<
			"includeAll" | "includeContent" | "project" | "roomId",
			"both"
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/MakeDefaultRoomToolsForEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeDefaultRoomToolsForEngine: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/MakeEngineMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeEngineMCP: ReactorContract<
		SourceParameters<
			"comment" | "engine" | "mcpMetadata" | "reactor",
			"both",
			["engine"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/MakeNotebookCellMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeNotebookCellMCP: ReactorContract<
		SourceParameters<
			"cellId" | "comment" | "model" | "project",
			"both",
			["cellId"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/MakePixelMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakePixelMCP: ReactorContract<
		SourceParameters<
			"comment" | "mcpMetadata" | "package" | "project" | "reactor",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/MakePythonMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakePythonMCP: ReactorContract<
		SourceParameters<"comment" | "engine" | "model" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/MakeRoomPixelMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeRoomPixelMCP: ReactorContract<
		SourceParameters<
			"mcpMetadata" | "reactor" | "roomId",
			"both",
			["reactor"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/MakeUserPixelMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MakeUserPixelMCP: ReactorContract<
		SourceParameters<
			"filePath" | "generator" | "mcpMetadata" | "reactor",
			"both",
			["filePath"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/ReadSkillFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReadSkillFile: ReactorContract<
		SourceParameters<"filePath" | "project", "both", ["filePath"], 2>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/RunAgentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunAgent: ReactorContract<
		SourceParameters<
			| "agentParams"
			| "command"
			| "engine"
			| "harnessType"
			| "image"
			| "maxReflections"
			| "maxTurns"
			| "media"
			| "paramMap"
			| "paramValues"
			| "roomId"
			| "space"
			| "url"
			| "wait"
			| "waitTimeoutMs"
			| "workspaceId",
			"both",
			["roomId", "command"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/RunMCPToolReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RunMCPTool: ReactorContract<
		SourceParameters<
			| "actionId"
			| "decision"
			| "engine"
			| "function"
			| "mcpToolResult"
			| "mcpToolStatus"
			| "paramValues"
			| "parentMessageId"
			| "project"
			| "roomId"
			| "runId"
			| "toolCallId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/mcp/SetRemoteMCPReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetRemoteMCP: ReactorContract<
		SourceParameters<
			"mcpAuthScheme" | "mcpAuthToken" | "mcpEndpoint" | "project",
			"both",
			["project", "mcpEndpoint"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/subagent/SpawnSubAgentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SpawnSubAgent: ReactorContract<
		SourceParameters<
			| "alias"
			| "context"
			| "engine"
			| "harnessType"
			| "inherit_parent_workdir"
			| "prompt"
			| "roomId"
			| "workspaceId",
			"both",
			["prompt"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/StopAgentRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	StopAgentRun: ReactorContract<
		SourceParameters<"runId", "both", ["runId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/skill/UpdateSkillReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateSkill: ReactorContract<
		SourceParameters<
			"description" | "skillContent" | "skillId",
			"both",
			["skillId"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/agent/subagent/WaitSubAgentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WaitSubAgent: ReactorContract<
		SourceParameters<"jobId" | "timeoutSec", "both", ["jobId"], 1>,
		string | null,
		false
	>;
}
