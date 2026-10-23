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

export interface ModelReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/model/AddToolExecutionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddToolExecution: ReactorContract<
		SourceParameters<
			| "engine"
			| "hiddenMessage"
			| "mcpToolStatus"
			| "paramValues"
			| "parentMessageId"
			| "responseParts"
			| "roomId"
			| "toolExecutionResponse"
			| "toolId"
			| "toolName"
			| "toolParameterValues"
			| "tool_execution_response",
			"both",
			["engine", "roomId", "toolId", "toolName"],
			4
		>,
		Record<string, unknown> | string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/AddWorkspaceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddWorkspace: ReactorContract<
		SourceParameters<
			| "description"
			| "mcp"
			| "name"
			| "prompts"
			| "skills"
			| "systemPrompt"
			| "useDefaultAgentTools",
			"both",
			["name"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/AskRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AskRoom: ReactorContract<
		SourceParameters<
			| "command"
			| "engine"
			| "hiddenMessage"
			| "media"
			| "paramValues"
			| "parentMessageId"
			| "responseParts"
			| "roomId"
			| "url",
			"both",
			["engine", "command"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/batch/BatchLLMReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BatchLLM: ReactorContract<
		SourceParameters<
			"engine" | "paramValues" | "requests" | "roomId" | "storage",
			"both",
			["engine", "requests"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/CanItRunReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CanItRun: ReactorContract<
		SourceParameters<"hfModelId", "both", ["hfModelId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/batch/CancelModelBatchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CancelModelBatch: ReactorContract<
		SourceParameters<
			"batchId" | "engine" | "paramValues",
			"both",
			["engine", "batchId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/CompactRoomMessagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CompactRoomMessages: ReactorContract<
		SourceParameters<
			"compactionTypes" | "parentMessageId" | "roomId",
			"both",
			["roomId", "parentMessageId"],
			2
		>,
		Record<string, unknown> | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/upload/CreateModelEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateModelEngine: ReactorContract<
		SourceParameters<"global" | "model" | "modelDetails", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/CreateRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateRoom: ReactorContract<
		SourceParameters<
			| "context"
			| "function"
			| "name"
			| "project"
			| "vectorDb"
			| "workspaceId",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/DeleteWorkspaceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteWorkspace: ReactorContract<
		SourceParameters<"workspaceId", "both", ["workspaceId"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/EditWorkspaceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditWorkspace: ReactorContract<
		SourceParameters<
			| "description"
			| "disabledDefaultTools"
			| "greeting"
			| "greetingEnabled"
			| "hooks"
			| "isActive"
			| "maxReflections"
			| "maxSeconds"
			| "maxSpawnsPerTurn"
			| "maxSubagentDepth"
			| "maxSubagentsPerRun"
			| "maxTurns"
			| "mcp"
			| "modelId"
			| "name"
			| "prompts"
			| "skills"
			| "subagents"
			| "systemPrompt"
			| "useDefaultAgentTools"
			| "workspaceId",
			"both",
			["workspaceId", "name"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/EmbedderKeywordExtractionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EmbedderKeywordExtraction: ReactorContract<
		SourceParameters<
			"input" | "limit" | "model" | "percentile",
			"both",
			["model", "input"],
			2
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/EmbeddingsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Embeddings: ReactorContract<
		SourceParameters<
			"engine" | "paramValues" | "values",
			"both",
			["engine", "values"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GenerateFollowUpQuestionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateFollowUpQuestions: ReactorContract<
		SourceParameters<
			| "engine"
			| "limit"
			| "paramValues"
			| "parentMessageId"
			| "roomId"
			| "suggestionContext",
			"both",
			["engine", "roomId"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GenerateRoomNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateRoomName: ReactorContract<
		SourceParameters<
			"engine" | "prompt" | "roomId",
			"both",
			["roomId", "prompt"],
			2
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/GetAgentFormOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAgentFormOptions: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/GetAllEngineUsageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetAllEngineUsage: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "limit" | "offset" | "startDate",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetContextWindowReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetContextWindow: ReactorContract<
		SourceParameters<"model", "both">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/GetEngineUsagePerProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineUsagePerProject: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "limit" | "offset" | "startDate",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/GetEngineUsagePerUserReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetEngineUsagePerUser: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "limit" | "offset" | "startDate",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetModelAPIReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelAPI: ReactorContract<
		SourceParameters<"model", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/batch/GetModelBatchResultsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelBatchResults: ReactorContract<
		SourceParameters<
			"batchId" | "engine" | "paramValues",
			"both",
			["engine", "batchId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/batch/GetModelBatchStatusReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelBatchStatus: ReactorContract<
		SourceParameters<
			"batchId" | "engine" | "paramValues",
			"both",
			["engine", "batchId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetModelBuiltinToolsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelBuiltinTools: ReactorContract<
		SourceParameters<
			"engine" | "modelId" | "modelProvider" | "servingProvider",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetModelGuardrailConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelGuardrailConfig: ReactorContract<
		SourceParameters<"engine", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetModelRouterConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelRouterConfig: ReactorContract<
		SourceParameters<"engine", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetMyOpenAiKeyModelsListReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetMyOpenAiKeyModelsList: ReactorContract<
		SourceParameters<
			"openaiKey" | "organizationId",
			"both",
			["openaiKey"],
			1
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetNodePoolsInfoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetNodePoolsInfo: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetPlatformMessageStructureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPlatformMessageStructure: ReactorContract<
		SourceParameters<"roomId", "both", ["roomId"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetRemoteModelDeployConfigsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRemoteModelDeployConfigs: ReactorContract<
		SourceParameters<"refresh", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/GetRoomMessagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRoomMessages: ReactorContract<
		SourceParameters<
			"limit" | "offset" | "roomId" | "sort",
			"both",
			["roomId"],
			1
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/GetRoomMessages2Reactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRoomMessages2: ReactorContract<
		SourceParameters<
			"limit" | "offset" | "roomId" | "sort",
			"both",
			["roomId"],
			1
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/GetRoomOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetRoomOptions: ReactorContract<
		SourceParameters<"roomId", "both", ["roomId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetStaticModelMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetStaticModelMetadata: ReactorContract<
		SourceParameters<"modelId", "both", ["modelId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/GetUserConversationRoomsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserConversationRooms: ReactorContract<
		SourceParameters<
			| "includeChildRooms"
			| "includeUnnamedRooms"
			| "limit"
			| "offset"
			| "pinned"
			| "project"
			| "roomOptionsSearch"
			| "search"
			| "sort",
			"both"
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetUserModelUsageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserModelUsage: ReactorContract<
		SourceParameters<
			"endDate" | "engine" | "startDate",
			"both",
			["engine"],
			1
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/GetUserModelUsageRestrictionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUserModelUsageRestrictions: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/GetWorkspaceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetWorkspace: ReactorContract<
		SourceParameters<"workspaceId", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/GetWorkspaceKnowledgeBaseReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetWorkspaceKnowledgeBase: ReactorContract<
		SourceParameters<
			"paramValues" | "workspaceId",
			"both",
			["workspaceId"],
			1
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/GetWorkspaceRoomsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetWorkspaceRooms: ReactorContract<
		SourceParameters<
			"filters" | "limit" | "offset" | "sort" | "workspaceId",
			"both",
			["workspaceId"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/LLMReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LLM: ReactorContract<
		SourceParameters<
			| "command"
			| "context"
			| "engine"
			| "image"
			| "media"
			| "paramValues"
			| "roomId"
			| "url"
			| "useHistory",
			"both",
			["engine", "command"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/LLM2Reactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	LLM2: ReactorContract<
		SourceParameters<
			| "command"
			| "context"
			| "engine"
			| "image"
			| "media"
			| "paramValues"
			| "roomId"
			| "url"
			| "useHistory",
			"both",
			["engine", "command"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/batch/ListModelBatchesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListModelBatches: ReactorContract<
		SourceParameters<
			"engine" | "limit" | "paramValues",
			"both",
			["engine"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/ListStaticModelCatalogReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListStaticModelCatalog: ReactorContract<
		SourceParameters<"servingProvider", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/ListWorkspacesReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListWorkspaces: ReactorContract<
		SourceParameters<"filters" | "limit" | "offset" | "sort", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/MatchStaticModelMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MatchStaticModelMetadata: ReactorContract<
		SourceParameters<"limit" | "modelId", "both", ["modelId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/MultiModalEmbeddingsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MultiModalEmbeddings: ReactorContract<
		SourceParameters<
			"engine" | "image" | "paramValues" | "text" | "video",
			"both",
			["engine"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/MyRemoteModelsStatus.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MyRemoteModelsStatus: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/NERReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	NER: ReactorContract<
		SourceParameters<
			"engine" | "entities" | "maskEntities" | "paramValues" | "prompt",
			"both",
			["engine", "prompt", "entities"],
			3
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/OpenAIDecisionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenAIDecisions: ReactorContract<
		SourceParameters<
			"engine" | "input" | "paramValues" | "questions",
			"both",
			["engine", "input", "questions"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/OpenAIPassthroughReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenAIPassthrough: ReactorContract<
		SourceParameters<"path" | "payload", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/OpenAIStreamPollReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	OpenAIStreamPoll: ReactorContract<
		SourceParameters<"jobId", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/PinRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PinRoom: ReactorContract<
		SourceParameters<"pinned" | "roomId", "both", ["roomId", "pinned"], 2>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/RemoteModelShutdownReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoteModelShutdown: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/RemoteModelStartReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoteModelStart: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/RemoveLlmFeedbackReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveLlmFeedback: ReactorContract<
		SourceParameters<"messageId", "both", ["messageId"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/RemoveUserRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveUserRoom: ReactorContract<
		SourceParameters<"roomId", "both", ["roomId"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/RenameRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RenameRoom: ReactorContract<
		SourceParameters<"name" | "roomId", "both", ["roomId", "name"], 2>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/SearchRoomMessagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SearchRoomMessages: ReactorContract<
		SourceParameters<
			| "includeChildRooms"
			| "includeUnnamedRooms"
			| "limit"
			| "offset"
			| "project"
			| "search",
			"both",
			["search"],
			2
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/SetRoomNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetRoomName: ReactorContract<
		SourceParameters<
			"roomId" | "roomName",
			"both",
			["roomId", "roomName"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/workspaces/SetRoomWorkspaceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SetRoomWorkspace: ReactorContract<
		SourceParameters<"roomId" | "workspaceId", "both", ["roomId"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/SubmitLlmFeedbackReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SubmitLlmFeedback: ReactorContract<
		SourceParameters<
			"feedbackText" | "messageId" | "rating" | "roomId",
			"both",
			["roomId", "messageId", "rating"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/batch/SubmitModelBatchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SubmitModelBatch: ReactorContract<
		SourceParameters<
			"engine" | "paramValues" | "requests",
			"both",
			["engine", "requests"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/SyncModelMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SyncModelMetadata: ReactorContract<
		SourceParameters<"dryRun" | "engine" | "force", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/TypeSafeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TypeSafe: ReactorContract<
		SourceParameters<
			"engine" | "paramValues" | "questions" | "state",
			"both",
			["engine", "state", "questions"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/UpdateModelGuardrailConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateModelGuardrailConfig: ReactorContract<
		SourceParameters<"engine" | "map", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/UpdateModelRouterConfigReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateModelRouterConfig: ReactorContract<
		SourceParameters<"engine" | "map", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/engine/impl/model/inferencetracking/reactors/UpdateRoomOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UpdateRoomOptions: ReactorContract<
		SourceParameters<"roomId" | "roomOptions", "both", ["roomId"], 1>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/model/VisionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Vision: ReactorContract<
		SourceParameters<
			"command" | "engine" | "image" | "paramValues",
			"both",
			["engine", "command", "image"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
}
