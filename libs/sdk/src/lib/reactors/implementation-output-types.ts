import type {
	ConstantTableTaskData,
	FormattedFilterOutput,
	FrameWireOutput,
	NestedPixelOutput,
	QueryFilterWireOutput,
	QuerySortWireOutput,
	QueryStructWireOutput,
	TableTaskData,
	TaskCollectionOutput,
} from "./query-output-types";
import type {
	EngineCatalogRow,
	ModelMessage,
	ProjectCatalogRow,
	ResourceOutputTypes,
} from "./resource-output-types";

/** JSON values whose structure is supplied at runtime by data, configuration, or an external service. */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue | undefined };

type JsonObject = { [key: string]: JsonValue | undefined };

/** @source Semoss/src/prerna/util/gson/TaskOptionsAdapter.java#write */
interface TaskOptionsWireOutput {
	options?: JsonObject;
	ornament: boolean;
}

/** @source Semoss/src/prerna/util/gson/IFormatterAdapter.java#write */
interface FormatterWireOutput {
	type?: string;
	options?: JsonObject;
}

/** @source Semoss/src/prerna/util/gson/ColorByValueRuleAdapter.java#write */
interface ColorByValueWireOutput {
	name?: string;
	options?: JsonObject;
	qs?: QueryStructWireOutput;
	filterInfo?: FormattedFilterOutput[];
	havingInfo?: FormattedFilterOutput[];
}

/**
 * PixelStreamUtility uses InsightPanelAdapter(true), so cached execution fields
 * appear only in full panel-state serialization. Config, ornaments, and events
 * are caller-defined maps; they are not inferred from Java field names.
 * @source Semoss/src/prerna/util/gson/InsightPanelAdapter.java#write
 */
export interface PanelWireOutput {
	panelId?: string;
	panelLabel?: string;
	sheetId?: string;
	view?: string;
	viewOptions?: string;
	renderedViewOptions?: string;
	numCollect: number;
	dynamicVars: (string | null)[];
	viewOptionsMap: Record<string, JsonObject>;
	config: JsonObject;
	ornaments: JsonObject;
	events: JsonObject;
	comments: Record<string, JsonObject>;
	filters: QueryFilterWireOutput[];
	order: QuerySortWireOutput[];
	cbv: ColorByValueWireOutput[];
	lastQs?: QueryStructWireOutput;
	lastQueryStructMap?: Record<string, QueryStructWireOutput>;
	lastTaskOptions?: TaskOptionsWireOutput;
	lastTaskOptionsMap?: Record<string, TaskOptionsWireOutput>;
	lastFormatter?: FormatterWireOutput;
	lastFormatterMap?: Record<string, FormatterWireOutput>;
}

/** @source Semoss/src/prerna/util/gson/InsightSheetAdapter.java#write */
export interface SheetWireOutput {
	sheetId?: string;
	sheetLabel?: string;
	backgroundColor?: string;
	hideHeaders?: boolean;
	hideBorders?: boolean;
	height?: string;
	width?: string;
	borderSize: number;
	gutterSize: number;
}

/** @source Semoss/src/prerna/sablecc2/PixelStreamUtility.java#processNounMetadata */
interface PixelRunnerWireOutput {
	name: string | null;
	core_engine: string | null;
	core_engine_id: string | null;
	recipe: string[];
	params?: JsonValue;
	additionalPixels?: string[];
	variableOutput?: JsonObject;
	insightData: { insightID: string; pixelReturn: NestedPixelOutput[] };
}

/** Gson's persisted noun envelope, distinct from a streamed Pixel return. */
interface SerializedNounMetadata {
	pixelType: string;
	class?: string | (string | null)[];
	value: JsonValue[];
	opType: string[];
}

/** Persisted recipe entries use PixelAdapter, including its renamed boolean fields. */
interface PixelWireOutput {
	id?: string;
	pixelString?: string;
	pixelAlias?: string;
	pixelDescription?: string;
	meta: boolean;
	isRefreshPanel: boolean;
	isCodeExecution: boolean;
	isUserScript: boolean;
	codeExecuted?: string;
	language?: "R" | "PYTHON" | "JAVA";
	isFrameTransformation: boolean;
	isAssignment: boolean;
	isFileRead: boolean;
	isSaveDataTransformation: boolean;
	isSaveDataExport: boolean;
	isSaveVisualization: boolean;
	timeToRun: number;
	errorReturned: boolean;
	warningReturned: boolean;
	startingFrameHeaders?: Record<string, JsonObject>;
	endingFrameHeaders?: Record<string, JsonObject>;
	frameInputs: (string | null)[];
	frameOutputs: (string | null)[];
	taskOptions: TaskOptionsWireOutput[];
	positionMap?: JsonObject;
	errorMessages?: (string | null)[];
	warningMessages?: (string | null)[];
}

/** AgentRunActionStore's selected columns, with JSON payloads parsed by its callers. */
export interface AgentActionOutput {
	actionId?: string;
	runId?: string;
	roomId?: string;
	parentMessageId?: string;
	toolCallId?: string;
	toolName?: string;
	toolArgs?: JsonValue;
	editedArgs?: JsonValue;
	toolMeta?: JsonValue;
	hasUi: boolean;
	uiUrl?: string;
	status?: string;
	result?: string;
	toolStatus?: string;
	dateCreated?: string;
	decidedAt?: string;
	userId?: string;
}

/** @source Semoss/src/prerna/reactor/agent/run/AgentRunStore.java#runMapFromRow */
export interface AgentRunOutput {
	runId?: string;
	parentRunId?: string;
	roomId?: string;
	roomName?: string;
	workspaceId?: string;
	modelId?: string;
	harnessType?: string;
	jobId?: string;
	status?: string;
	input?: string;
	inputMessageId?: string;
	finalText?: string;
	finalOutputMessageId?: string;
	errorMessage?: string;
	progress?: JsonObject;
	dateCreated?: string;
	startedAt?: string;
	completedAt?: string;
	userId?: string;
	artifacts: JsonObject[];
	reviewOutcome?: JsonObject;
	warnings?: string[];
	pendingActions?: AgentActionOutput[];
	/** Harnesses can project provider transcript activity into this list. */
	messages?: JsonObject[];
}

/** MCP schemas and metadata can be supplied by project files or remote servers. */
interface McpDocument {
	tools: JsonObject[];
	_meta: { last_modified_date: string; [key: string]: JsonValue | undefined };
}

/** Validated by PptxInspectionService.validateReply before being merged into a report. */
interface PptxIssue {
	severity: "major" | "minor";
	category: string;
	location: string;
	evidence: string;
	suggestedFix: string;
	slide: number;
}

interface PptxAttempt {
	stage: "slide" | "consistency";
	attempt: number;
	slide?: number;
	outcome?: "success" | "failed" | "inconclusive";
	observations?: string;
	limitations?: string[];
	kind?: string;
	message?: string;
	durationMs?: number;
	attempts?: number;
}

/** Includes the early structured rendering-failure result as well as completed inspections. */
interface PptxInspectionOutput {
	schemaVersion: 2;
	filePath: string;
	status: "complete" | "partial" | "failed";
	verdict: "inconclusive" | "needs_changes" | "pass";
	reviewedSlides: number[];
	unreviewedSlides: number[];
	requestedSlides: "all" | number[];
	issues: PptxIssue[];
	limitations: string[];
	observations: {
		stage: "slide" | "consistency";
		slide?: number;
		text: string;
	}[];
	errors: string[];
	failures: PptxAttempt[];
	attempts: PptxAttempt[];
	artifacts: {
		pdf?: string;
		images?: {
			slide: number;
			path: string;
			width: number;
			height: number;
		}[];
		overviews?: string[];
		report?: string;
	};
	sourceHash?: string;
	slideCount?: number;
	hiddenSlides?: number[];
	cacheHit?: boolean;
	renderer?: string;
	imageLongEdge?: number;
	inconclusiveSlides?: number[];
	consistencyReview?:
		| "not_requested"
		| "failed"
		| "complete"
		| "inconclusive"
		| "incomplete";
	sourceChanged?: boolean;
	usage?: {
		modelCalls: number;
		retryCalls: number;
		inputTokens: number;
		outputTokens: number;
	};
	engine: string;
	modelRooms: string[];
}

type LogActivityRecordOutput = {
	requestId?: string;
	startTime?: string;
	endTime?: string;
	request?: string;
	response?: string;
	tokens: number;
	latency: number;
	status: boolean;
	engineName?: string;
	engineType?: string;
	methodName?: string;
	userName?: string;
	userId?: string;
	sessionId?: string;
	spanId?: string;
	logTimestamp?: string;
	guardrailAction?: string;
	cacheReadTokens: number;
	cacheCreationTokens: number;
	promptTokens: number;
	responseTokens: number;
	billedSourceType?: string;
	billedSubjectId?: string;
	billedSubjectType?: string;
};

type InsightParameterOutput = {
	detailsList?: ({
		baseQsType?: "SQS" | "HQS";
		parameterFillType?: "DATASOURCE" | "FILTER";
		appId?: string;
		databaseId?: string;
		pixelId?: string;
		pixelString?: string;
		tableName?: string;
		tableAlias?: string;
		columnName?: string;
		currentValue?: unknown;
		operator?: string;
		type?:
			| "CONST_DECIMAL"
			| "CONST_INT"
			| "CONST_STRING"
			| "CONST_DATE"
			| "CONST_TIMESTAMP"
			| "CONST_DAY"
			| "CONST_WEEK"
			| "CONST_MONTH"
			| "CONST_YEAR"
			| "NULL_VALUE"
			| "VECTOR"
			| "MAP"
			| "BOOLEAN"
			| "ERROR"
			| "SUB_QUERY_EXPRESSION"
			| "COLUMN"
			| "TASK"
			| "TASK_LIST"
			| "REMOVE_VARIABLE"
			| "REMOVE_TASK"
			| "REMOVE_LAYER"
			| "DROP_INSIGHT"
			| "SHEET"
			| "PANEL"
			| "PANEL_CLONE_MAP"
			| "FILE_REFERENCE"
			| "FRAME"
			| "FRAME_MAP"
			| "BOOLEAN_METADATA"
			| "UPLOAD_RETURN_MAP"
			| "ORNAMENT_MAP"
			| "PARAM_STRUCT"
			| "PREAPPLIED_PARAM_STRUCT"
			| "SQLE"
			| "E"
			| "FILTER"
			| "COMPARATOR"
			| "JOIN"
			| "CODE"
			| "VARIABLE"
			| "QUERY_STRUCT"
			| "RAW_DATA_SET"
			| "FORMATTED_DATA_SET"
			| "ITERATOR"
			| "EXPORT"
			| "LAMBDA"
			| "ALIAS"
			| "IN_MEM_STORE"
			| "PLANNER"
			| "CACHED_CLASS"
			| "INVALID_SYNTAX"
			| "R_CONNECTION"
			| "R_ENGINE"
			| "STORAGE"
			| "MODEL"
			| "VECTORDB"
			| "PROJECT_EMAIL_SESSION"
			| "PROJECT_AUTHORIZATION_HEADER"
			| "PIXEL_OBJECT"
			| "JSON_OBJECT"
			| "CUSTOM_DATA_STRUCTURE"
			| "CACHED_PIXEL_RUNNER"
			| "PIXEL_RUNNER"
			| "PARAM_VALUES_MAP"
			| "MCP_TOOL_EXECUTION";
		level?: "DATASOURCE" | "COLUMN" | "TABLE" | "OPERATOR" | "OPERATORU";
		quote?: "NO" | "SINGLE" | "DOUBLE";
		uOperator?: string;
		context?: string;
		contextPart?: string;
		defQuery?: string;
		importSource?: string;
	} | null)[];
	searchable: boolean;
	multiple: boolean;
	paramName?: string;
	appId?: string;
	databaseId?: string;
	modelQuery?: string;
	manualChoices?: unknown;
	modelDisplay?: string;
	modelLabel?: string;
	required: boolean;
	defaultValue?: unknown;
	populateInAudit: boolean;
	isPreApplied: boolean;
	fillType?: "MANUAL" | "PIXEL" | "QUERY";
};

type CalendarEventOutput = {
	id?: string;
	subject?: string;
	start?: null | string | null | string;
	end?: null | string | null | string;
	timeZone?: string;
	isAllDay?: boolean;
	location?: string;
	organizer?: string;
	organizerName?: string;
	attendees?: {
		address?: string;
		name?: string;
		type?: string;
		response?: string;
	}[];
	webLink?: string;
	joinUrl?: string;
	isOnlineMeeting?: boolean;
	isCancelled?: boolean;
	showAs?: string;
	importance?: string;
	responseStatus?: string;
	reminderMinutesBeforeStart?: number;
	categories?: (string | null)[];
	isRecurring?: boolean;
	body?: string;
	bodyTruncated?: boolean;
};

type MailMessageOutput = {
	id?: string;
	internetMessageId?: string;
	conversationId?: string;
	from?: string;
	fromName?: string;
	to?: (string | null)[];
	cc?: (string | null)[];
	subject?: string;
	sentDate?: null | string;
	receivedDate?: null | string;
	unread?: boolean;
	hasAttachments?: boolean;
	webLink?: string;
	body?: string;
	bodyTruncated?: boolean;
	uniqueBody?: string;
	uniqueBodyTruncated?: boolean;
	attachments?: {
		id?: string;
		name?: string;
		contentType?: string;
		size?: number;
		isInline?: boolean;
		kind?: string;
	}[];
	displayBody?: {
		contentType: "text" | "html";
		content: string;
		isTruncated: boolean;
		attachments?: { name: string }[];
	};
	replyRecipients?: { to?: (string | null)[]; cc?: (string | null)[] };
};

type AutomationRunRow = {
	RUN_ID?: string;
	PROJECT_ID?: string;
	AUTOMATION_ID?: string;
	DEFINITION_VERSION?: number;
	DEFINITION_HASH?: string;
	DEFINITION_SNAPSHOT?: string;
	STATUS?: string;
	TRIGGER_TYPE?: string;
	STARTED_AT?: string;
	COMPLETED_AT?: string;
	FAILED_NODE_ID?: string;
	ERROR_MESSAGE?: string;
	TOTAL_NODES?: number;
	COMPLETED_NODES?: number;
	CREATED_BY?: string;
	RESULT_SUMMARY?: string;
};

type AutomationWaitOutput = {
	WAIT_ID?: string;
	RUN_ID?: string;
	NODE_ID?: string;
	WAIT_TYPE?: string;
	AGENT_RUN_ID?: string;
	ROOM_ID?: string;
	RESUME_NODE_ID?: string;
	STATUS?: string;
	CREATED_BY?: string;
	STARTED_AT?: string;
	EXPIRES_AT?: string;
	RESOLVED_AT?: string;
	RESOLVED_BY?: string;
};

type AutomationSavedResultOutput = {
	RESULT_ID?: string;
	PROJECT_ID?: string;
	RUN_ID?: string;
	NODE_ID?: string;
	PARENT_NODE_ID?: string;
	ITERATION_INDEX?: number;
	RESULT_KIND?: string;
	FORMAT_VERSION?: number;
	ROW_COUNT?: number;
	BYTE_COUNT?: number;
	CHECKSUM?: string;
	CREATED_AT?: string;
	RETAIN_UNTIL?: string;
	CAPTURE_STATE?: string;
	RESULT_ROLE?: string;
	LOGICAL_NAME?: string;
};

type AutomationNodeResult = {
	NODE_ID?: string;
	NODE_LABEL?: string;
	STATUS?: string;
	DURATION_MS?: number;
	OUTPUT_PREVIEW?: string;
	OUTPUT_VALUE?: string;
	ERROR_MESSAGE?: string;
	trace?: {
		automationRunId?: string;
		nodeId?: string;
		roomId?: string;
		workspaceId?: string;
		modelMessageId?: string;
		agentRunId?: string;
		agentStatus?: string;
	};
	iterations?: { index: number; nodeResults: AutomationNodeResult[] }[];
};

type AutomationRunOutput = AutomationRunRow & {
	nodeResults?: AutomationNodeResult[];
	savedResults?: AutomationSavedResultOutput[];
	executionInsightId?: string;
	wait?: AutomationWaitOutput;
	globals?: JsonObject;
	scope?: JsonObject;
	waitingForInput?: boolean;
};

type PlaywrightStepOutput = {
	id: number;
	type?:
		| "NAVIGATE"
		| "CLICK"
		| "TYPE"
		| "SCROLL"
		| "WAIT"
		| "CONTEXT"
		| "HOVER";
	url?: string;
	coords?: { x: number; y: number };
	multiCoords?: ({ x: number; y: number } | null)[];
	prompt?: string;
	text?: string;
	pressEnter?: boolean;
	deltaY?: number;
	waitUntil?: string;
	waitAfterMs?: number;
	viewport?: { width: number; height: number; deviceScaleFactor: number };
	timestamp?: number;
	label?: string;
	description?: string;
	isPassword: boolean;
	storeValue: boolean;
	selector?: { strategy?: string; value?: string; frameSelector?: string };
	isTriggerNewTab?: { isTrue: boolean; tabId?: string };
	shouldRun?: boolean;
	required?: boolean;
	sendToPlayground?: boolean;
	tag?: string;
};

type AgentToolStats = {
	calls: number;
	failed: number;
	unanswered: number;
	serverToolCalls: number;
	avgDurationMs?: number;
};

type AgentEffectivenessScore = {
	weights: {
		completion: number;
		toolReliability: number;
		efficiency: number;
		discipline: number;
	};
	components?: {
		completion: number;
		toolReliability: number;
		efficiency: number;
		discipline: number;
	};
	value?: number;
	excludedReason?: string;
};

type AgentRunMetrics = {
	runId?: string;
	parentRunId?: string;
	harnessType?: string;
	modelId?: string;
	status?: string;
	startedAt?: string;
	completedAt?: string;
	wallClockMs?: number;
	outcome: {
		terminal: boolean;
		completed: boolean;
		errorMessage?: string;
		maxTurnsReached: boolean;
	};
	turns: {
		assistantMessages: number;
		toolRoundTrips: number;
		textParts: number;
		thinkingParts: number;
	};
	tools: {
		totalCalls: number;
		serverToolCalls: number;
		evaluatedCalls: number;
		succeeded: number;
		failed: number;
		unanswered: number;
		successRate?: number;
		byTool: Record<string, AgentToolStats>;
		failures: {
			toolName?: string;
			toolCallId?: string;
			category: string;
			outputPreview?: string;
		}[];
	};
	improperUse: {
		unknownToolCalls: number;
		malformedArgumentCalls: number;
		spawnRejectedCalls: number;
		unansweredToolCalls: number;
		duplicateCallWaste: number;
		duplicateCallGroups: { toolName: string; identicalCalls: number }[];
	};
	skills: {
		listSkillCalls: number;
		skillLoadCalls: number;
		skillLoadFailures: number;
		distinctSkillsLoaded: string[];
		skillsNeverLoadedSuccessfully: string[];
	};
	tokens: {
		available: boolean;
		inputTokens: number;
		outputTokens: number;
		thinkingTokens: number;
		cacheReadTokens: number;
		cacheCreationTokens: number;
	};
	score: AgentEffectivenessScore;
};

type AgentEffectivenessRollup = {
	runCount: number;
	runsCompleted: number;
	runsFailed: number;
	runsCancelled: number;
	runsInFlight: number;
	runsHitMaxTurns: number;
	runCompletionRate?: number;
	toolCalls: number;
	toolFailures: number;
	toolSuccessRate?: number;
	unansweredToolCalls: number;
	unknownToolCalls: number;
	malformedArgumentCalls: number;
	duplicateCallWaste: number;
	skillLoadCalls: number;
	skillLoadFailures: number;
	distinctSkillsLoaded: string[];
	byTool: Record<string, AgentToolStats>;
	averageScore?: number;
	minScore?: number;
	scoredRuns: number;
};

type RoomInferenceStats = {
	available: boolean;
	llmCalls?: number;
	outputTokens?: number;
	thinkingTokens?: number;
	totalResponseTimeMs?: number;
	avgResponseTimeMs?: number;
	maxResponseTimeMs?: number;
	inputTokens?: number;
	cacheReadTokens?: number;
	cacheCreationTokens?: number;
};

type ConceptPropertiesOutput = Record<
	string,
	{ conceptualName: string; propSet: string[] }[]
>;

type ResourceAuditEvent = {
	EVENT_ID?: string;
	EVENT_TIME?: string;
	EVENT_TYPE?: string;
	ACTION?: string;
	STATUS?: string;
	CATEGORY?: string;
	SEVERITY?: string;
	ACTOR_USER_ID?: string;
	ACTOR_USER_TYPE?: string;
	ACTOR_USER_NAME?: string;
	SUBJECT_USER_ID?: string;
	SUBJECT_USER_TYPE?: string;
	SUBJECT_USER_NAME?: string;
	TARGET_TYPE?: string;
	TARGET_ID?: string;
	TARGET_NAME?: string;
	OLD_VALUE?: string;
	NEW_VALUE?: string;
	DETAILS?: string;
	TARGET_DISPLAY_NAME?: string;
	TARGET_ENGINE_TYPE?: string;
	TARGET_ENGINE_SUBTYPE?: string;
};

type NotificationWireOutput = {
	notification_actiontype: "NONE" | "NEW";
	notification_isread: boolean;
	display_surface: "BELL" | "MODAL" | "TOAST" | "BANNER";
	metadata: JsonObject;
	recipient_user_name: string;
	notification_id?: string;
	recipient_id?: string;
	recipient_type?: string;
	notification_title?: string;
	notification_message?: string;
	notification_priority?: string;
	notification_type?: string;
	catalog_id?: string;
	notification_createddate?: string;
	notification_source?: string;
	recipient_user_id?: string;
	notification_usertype?: string;
	user_existingrole?: string;
	user_newrole?: string;
	notification_createdby?: string;
	type?: string;
	scope_type?: string;
	scope_id?: string;
	target_type?: string;
	target_id?: string;
	created_at?: string;
	catalog_name?: string;
};

type PromptOutput = {
	id?: string;
	title?: string;
	context?: string;
	version?: number;
	intent?: string;
	created_by?: string;
	date_created?: string;
	global?: boolean;
	tags?: (string | null)[];
	metaKeys?: Record<string, (string | null)[]>;
};

type TranscriptEnvelope<Data> = {
	uuid: string;
	parentUuid?: string;
	sessionId: string;
	data: Data;
};

type ClaudeTranscriptEvent =
	| (TranscriptEnvelope<{
			promptId?: string;
			text: string;
			timestamp: string;
	  }> & { event: "user_prompt" })
	| (TranscriptEnvelope<{
			toolUseId?: string;
			status: string;
			durationMs: number;
			filePath?: string;
			content?: string;
			timestamp: string;
			stats?: {
				readCount: number;
				searchCount: number;
				bashCount: number;
				editFileCount: number;
				linesAdded: number;
				linesRemoved: number;
			};
	  }> & { event: "tool_result" })
	| (TranscriptEnvelope<{
			maxTurns: number;
			turnCount: number;
			timestamp: string;
	  }> & { event: "max_turns_reached" })
	| (TranscriptEnvelope<{
			model: string;
			stopReason?: string;
			usage?: JsonObject;
			texts?: { text: string; model: string; timestamp: string }[];
			thinking?: {
				thinking?: string;
				redacted: boolean;
				model: string;
				timestamp: string;
			}[];
			toolInvocations?: {
				toolUseId: string;
				toolName: string;
				description: string;
				subagentType?: string;
				arguments: JsonObject;
				timestamp: string;
			}[];
	  }> & { event: "assistant" });

type CopilotTranscriptEvent =
	| (TranscriptEnvelope<{
			promptId: string;
			text: string;
			timestamp: string;
	  }> & { event: "user_prompt" })
	| (TranscriptEnvelope<{
			kind: "tool-result";
			eventId: string;
			toolUseId: string;
			status: "running" | "completed" | "error";
			isPartial: boolean;
			durationMs: number;
			timestamp: string;
			content?: string;
	  }> & { event: "tool_result" })
	| (TranscriptEnvelope<{
			timestamp: string;
			model?: string;
			texts?: {
				eventId: string;
				text: string;
				display?: "intent";
				timestamp: string;
				isPartial: boolean;
				model?: string;
				parentToolUseId?: string;
			}[];
			toolInvocations?: {
				eventId: string;
				toolUseId: string;
				toolName: string;
				timestamp: string;
				description?: string;
			}[];
	  }> & { event: "assistant" });

type LegacyInsightParameter = {
	name?: string;
	query?: string;
	type?: string;
	options?: (string | null)[];
	hasQuery?: boolean;
	paramID?: string;
	depends?: string;
	dependVars?: (string | null)[];
	selected?: unknown;
	dbQuery: boolean;
	multiSelect: boolean;
	componentFilterId?: string;
};

type GuardrailValue = {
	pass: boolean;
	returnPrompt?: string;
	fullDetails?: unknown;
};

type ScreenshotWireOutput = {
	base64Png?: string;
	width: number;
	height: number;
	deviceScaleFactor: number;
};

/** Implementation-traced output overrides. Input contracts and runtime responses are unchanged. */
export interface ImplementationOutputTypes {
	/** @source Semoss/src/prerna/reactor/automation/definition/AddAutomationStepReactor.java#addStep */
	AddAutomationStep: {
		node?: {
			id?: string;
			type?: string;
			label?: string;
			outputVar?: string;
			codeMode?: string;
			config?: Record<string, JsonValue>;
			body?: { nodes: JsonValue[]; edges: JsonValue[] };
			position?: { x: number; y: JsonValue };
		};
		nodeSources?: Record<string, string | null>;
		revision?: string;
	};
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/AddInsightParameterReactor.java#execute */
	AddInsightParameter: InsightParameterOutput;
	/** @source Semoss/src/prerna/reactor/utils/AddOperationAliasReactor.java#execute */
	AddOperationAlias: "no output";
	/** @source Semoss/src/prerna/reactor/panel/AddPanelReactor.java#execute */
	AddPanel: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/rules/AddPanelColorByValueReactor.java#execute */
	AddPanelColorByValue: {
		panelId: string;
		name: string;
		filterInfo: FormattedFilterOutput[];
		havingInfo: FormattedFilterOutput[];
		options?: JsonObject;
	};
	/** @source Semoss/src/prerna/reactor/panel/comments/AddPanelCommentReactor.java#execute */
	AddPanelComment: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/AddPanelConfigReactor.java#execute */
	AddPanelConfig: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/events/AddPanelEventsReactor.java#execute */
	AddPanelEvents: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/filter/AddPanelFilterReactor.java#execute */
	AddPanelFilter: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/panel/AddPanelIfAbsentReactor.java#execute */
	AddPanelIfAbsent: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/ornaments/AddPanelOrnamentsReactor.java#execute */
	AddPanelOrnaments: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/sort/AddPanelSortReactor.java#execute */
	AddPanelSort:
		| string
		| { type?: "FRAME" | "PANEL"; name?: string; filterVal: boolean };
	/** @source Semoss/src/prerna/reactor/panel/sort/AddPanelSortByReactor.java#execute */
	AddPanelSortBy: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/model/AddToolExecutionReactor.java#execute */
	AddPlaygroundToolExecution: ResourceOutputTypes["AddToolExecution"];
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/AddPreDefinedParameterReactor.java#execute */
	AddPreDefinedParameter: JsonObject[];
	/** @source Semoss/src/prerna/reactor/sheet/AddSheetReactor.java#execute */
	AddSheet: SheetWireOutput;
	/** @source Semoss/src/prerna/usertracking/reactors/AdminAuditEventsReactor.java#execute */
	AdminAuditEvents: {
		data: {
			headers: string[];
			values: (string | number | boolean | null)[][];
		};
		snapshot: string;
		rowCount: number;
	};
	/** @source Semoss/src/prerna/io/connector/jira/AdminJiraInsertConnectionsReactor.java#execute */
	AdminJiraInsertConnections: { id?: string; success?: boolean };
	/** @source Semoss/src/prerna/cluster/util/AdminPushLocalToCloudReactor.java#execute */
	AdminPushLocalToCloud:
		| ({
				dryRun?: boolean;
				added_dbIds?: string[];
				added_storageIds?: string[];
				added_modelIds?: string[];
				added_vectorIds?: string[];
				added_functionIds?: string[];
				added_projectIds?: string[];
		  } & (string | null)[])
		| null;
	/** @source Semoss/src/prerna/io/connector/salesforce/AdminSalesforceInsertConnectionsReactor.java#execute */
	AdminSalesforceInsertConnections: { id?: string; success?: boolean };
	/** @source Semoss/src/prerna/io/connector/servicenow/AdminServiceNowInsertConnectionsReactor.java#execute */
	AdminServiceNowInsertConnections: { id?: string; success?: boolean };
	/** @source Semoss/src/prerna/usertracking/reactors/AdminUserAuditEventsReactor.java#execute */
	AdminUserAuditEvents: QueryStructWireOutput;
	/** @source Semoss/src/prerna/usertracking/reactors/AdminVerifyAuditTrailReactor.java#execute */
	AdminVerifyAuditTrail: { verifiedEvents: number; scope: string };
	/** @source Semoss/src/prerna/reactor/masterdatabase/AllConceptualNamesReactor.java#execute */
	AllConceptualNames: string[];
	/** @source Semoss/src/prerna/reactor/model/AskRoomReactor.java#execute */
	AskPlayground: ResourceOutputTypes["AskRoom"];
	/** @source Semoss/src/prerna/reactor/agent/metrics/AssessAgentEffectivenessReactor.java#execute */
	AssessAgentEffectiveness: {
		runId: string;
		roomId?: string;
		harnessType?: string;
		judgeModelId: string;
		assessment?: JsonObject;
		assessmentRaw?: string;
		parseError?: string;
		judgeUsage: { promptTokens?: number; responseTokens?: number };
		metrics: AgentRunMetrics;
	};
	/** @source Semoss/src/prerna/reactor/AssignmentReactor.java#execute */
	Assignment: unknown;
	/** @source Semoss/src/prerna/reactor/Assimilator.java#execute */
	Assimilator: string | number | null;
	/** @source Semoss/src/prerna/reactor/agent/skill/AttachSkillToWorkspaceReactor.java#execute */
	AttachSkillToWorkspace: {
		workspace_resource_id?: string | null | string;
		workspace_id?: string;
		skill_id?: string;
		created?: boolean;
		warning?: string;
		dependency_warning?: string;
	};
	/** @source Semoss/src/prerna/logging/AuditLogReportReactor.java#execute */
	AuditLogReport: { totalCount: number; logs: LogActivityRecordOutput[] };
	/** @source Semoss/src/prerna/logging/AuditLogsReportReactor.java#execute */
	AuditLogsReport: { totalCount: number; logs: LogActivityRecordOutput[] };
	/** @source Semoss/src/prerna/reactor/utils/BackupDatabaseReactor.java#execute */
	BackupDatabase: "no output";
	/** @source Semoss/src/prerna/util/git/reactors/BrowseAssetReactor.java#execute */
	BrowseAsset: {
		path?: string;
		name?: string;
		type?: string;
		lastModified?: string;
	}[];
	/** @source Semoss/src/prerna/reactor/insights/fs/BrowseInsightAssetsReactor.java#execute */
	BrowseInsightAssets: ResourceOutputTypes["BrowseAppAssets"];
	/** @source Semoss/src/prerna/reactor/user/fs/BrowseUserAssetsReactor.java#execute */
	BrowseUserAssets: ResourceOutputTypes["BrowseAppAssets"];
	/** @source Semoss/src/prerna/reactor/panel/CachedPanelReactor.java#execute */
	CachedPanel: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/CachedPanelCloneReactor.java#execute */
	CachedPanelClone: {
		original?: PanelWireOutput | null;
		clone?: PanelWireOutput | null | PanelWireOutput;
	};
	/** @source Semoss/src/prerna/reactor/sheet/CachedSheetReactor.java#execute */
	CachedSheet: SheetWireOutput | null;
	/** @source Semoss/src/prerna/reactor/CalcVarReactor.java#execute */
	CalcVar: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/automation/run/CancelAutomationRunReactor.java#execute */
	CancelAutomationRun: {
		RUN_ID: string;
		cancelRequested: boolean;
		signalledLocally: boolean;
		STATUS?: string;
	};
	/** @source Semoss/src/prerna/reactor/CheckEngineNameReactor.java#execute */
	CheckEngineName: { exists?: boolean };
	/** @source Semoss/src/prerna/reactor/insights/save/CheckInsightNameExistsReactor.java#execute */
	CheckInsightNameExists: {
		exists?: boolean;
		projectId?: string;
		insightId?: string;
		userCanEdit?: boolean;
	};
	/** @source Semoss/src/prerna/reactor/playwright/CheckNetworkIdleReactor.java#execute */
	CheckNetworkIdle: {
		isNetworkIdle?: boolean;
		inFlightRequests?: number;
		lastActivityTs?: number;
		quietMillis?: number;
		currentUrl?: string | null | string | null;
	};
	/** @source Semoss/src/prerna/reactor/CheckProjectNameReactor.java#execute */
	CheckProjectName: { exists?: boolean };
	/** @source Semoss/src/prerna/reactor/utils/CheckPyPackagesReactor.java#execute */
	CheckPyPackages: { pyInstalled?: boolean; PY?: (string | null)[] };
	/** @source Semoss/src/prerna/reactor/utils/CheckRPackagesReactor.java#execute */
	CheckRPackages: { RInstalled?: boolean; R?: (string | null)[] };
	/** @source Semoss/src/prerna/reactor/insights/ClearInsightReactor.java#execute */
	ClearInsight: { suppress?: boolean };
	/** @source Semoss/src/prerna/reactor/panel/CloneReactor.java#execute */
	Clone: { original?: PanelWireOutput | null; clone?: PanelWireOutput };
	/** @source Semoss/src/prerna/reactor/agent/skill/CloneSkillReactor.java#execute */
	CloneSkill: {
		skill_id?: string;
		project_id?: string;
		name?: string | null | string;
		slug?: string;
		source_skill_id?: string;
	};
	/** @source Semoss/src/prerna/reactor/util/ConvertFileUnoserverReactor.java#execute */
	ConvertFileUnoserver: {
		fileName?: string;
		filePath?: string | null | string;
		sourceSize?: string;
		size?: string;
	};
	/** @source Semoss/src/prerna/util/git/reactors/CopyReactor.java#execute */
	Copy: {
		targetType: "INSIGHT" | "ROOM" | "PROJECT" | "ENGINE" | "USER";
		target?: string;
		targetFilePath: string;
		size: number;
		versioned: boolean;
	};
	/** @source Semoss/src/prerna/reactor/insights/copy/CopyInsightReactor.java#execute */
	CopyInsight: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/notification/CreateAppNotificationReactor.java#execute */
	CreateAppNotification: {
		notificationId?: string;
		scopeType?: string;
		audienceType?: string;
	};
	/** @source Semoss/src/prerna/reactor/automation/project/CreateAutomationReactor.java#execute */
	CreateAutomation: ResourceOutputTypes["CreateProject"];
	/** @source Semoss/src/prerna/reactor/guardrail/upload/CreateGuardrailEngineReactor.java#execute */
	CreateGuardrailEngine: ResourceOutputTypes["CreateModelEngine"];
	/** @source Semoss/src/prerna/reactor/algorithms/CreateNLPVizReactor.java#execute */
	CreateNLPViz: TaskCollectionOutput;
	/** @source Semoss/src/prerna/playground/reactors/CreatePlaygroundRoomReactor.java#execute */
	CreatePlaygroundRoom: { roomId?: string };
	/** @source Semoss/src/prerna/reactor/agent/skill/CreateSkillReactor.java#execute */
	CreateSkill: {
		skill_id?: string;
		project_id?: string;
		slug?: string;
		name?: string | null;
	};
	/** @source Semoss/src/prerna/reactor/venv/upload/CreateVenvEngineReactor.java#execute */
	CreateVenvEngine: ResourceOutputTypes["CreateModelEngine"];
	/** @source Semoss/src/prerna/reactor/insights/CurrentVariablesReactor.java#execute */
	CurrentVariables: { PIXEL?: Record<string, string | null> };
	/** @source Semoss/src/prerna/tcp/client/CustomReactorWrapper.java#execute */
	CustomReactorWrapper: unknown;
	/** @source Semoss/src/prerna/date/reactor/DateReactor.java#execute */
	DATE: string;
	/** @source Semoss/src/prerna/date/reactor/DayReactor.java#execute */
	DAY: { numDays: number };
	/** @source Semoss/src/prerna/reactor/insights/dashboard/DashboardInsightConfigReactor.java#execute */
	DashboardInsightConfig: {
		insightConfig?: {
			name?: string;
			app_id?: string;
			app_insight_id?: string;
			recipe?: string;
			core_engine?: string;
			core_engine_id?: string;
			oldId?: string;
			newId?: string;
		}[];
		layoutConfig?: string;
	};
	/** @source Semoss/src/prerna/util/usertracking/reactors/recommendations/DatabaseRecommendationsReactor.java#execute */
	DatabaseRecommendations: {
		Communities?: {
			appName?: string;
			appId?: string;
			appType?: string;
			access?: boolean;
			freq?: string;
		}[][];
		Recommendations?: {
			appName?: string;
			appId?: string;
			appType?: string;
			access?: boolean;
			freq?: string;
		}[][];
	};
	/** @source Semoss/src/prerna/date/reactor/DateReactor.java#execute */
	Date: string;
	/** @source Semoss/src/prerna/date/reactor/DateManipulationReactor.java#execute */
	DateManipulation: string | number;
	/** @source Semoss/src/prerna/date/reactor/DayReactor.java#execute */
	Day: { numDays: number };
	/** @source Semoss/src/prerna/reactor/agent/DeclineDelegationReactor.java#execute */
	DeclineDelegation: {
		actionId?: string;
		status?: string;
		roomId?: string;
		requester?: JsonObject;
		requesterName?: string;
		response?: string;
		dateCreated?: string;
		decidedAt?: string;
	} & JsonObject;
	/** @source Semoss/src/prerna/query/querystruct/delete/DeleteReactor.java#execute */
	Delete: QueryStructWireOutput;
	/** @source Semoss/src/prerna/reactor/agent/mcp/DeleteFunctionsInMCPDriverReactor.java#execute */
	DeleteFunctionsInMCPDriver:
		| boolean
		| { "mcp_driver.py"?: boolean; "py_mcp.json"?: boolean };
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/DeleteInsightParameterReactor.java#execute */
	DeleteInsightParameter: InsightParameterOutput | "no output";
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/DeleteInsightRecipeStepReactor.java#execute */
	DeleteInsightRecipeStep: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/filter/DeletePanelFilterReactor.java#execute */
	DeletePanelFilter: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/agent/skill/DeleteSkillReactor.java#execute */
	DeleteSkill: boolean;
	/** @source Semoss/src/prerna/reactor/playwright/DeleteStepReactor.java#execute */
	DeleteStep: {
		success?: boolean;
		deletedStepId?: number;
		screenshot?: {
			base64Png?: string;
			width: number;
			height: number;
			deviceScaleFactor: number;
		};
		message?: string;
	};
	/** @source Semoss/src/prerna/reactor/playwright/DeleteTabReactor.java#execute */
	DeleteTab: { success?: boolean; message?: string; deletedTab?: string };
	/** @source Semoss/src/prerna/reactor/agent/skill/DetachSkillFromWorkspaceReactor.java#execute */
	DetachSkillFromWorkspace: {
		workspace_id?: string;
		skill_id?: string;
		removed?: boolean;
		warning?: string;
		dependency_warning?: string;
	};
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/DownloadInsightRecipeReactor.java#execute */
	DownloadInsightRecipe:
		| { name?: string; core_engine?: string; core_engine_id?: string }
		| string;
	/** @source Semoss/src/prerna/reactor/insights/DropInsightReactor.java#execute */
	DropInsight: true;
	/** @source Semoss/src/prerna/reactor/EchoReactor.java#execute */
	Echo: unknown;
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/EditInsightRecipeStepReactor.java#execute */
	EditInsightRecipeStep: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/scheduler/EditScheduledJobReactor.java#execute */
	EditScheduledJob: {
		"-jobId"?: string;
		"-jobName"?: string;
		"-jobGroup"?: string;
		"-jobCronExpression"?: string;
		"-jobCronTimeZone"?: string;
		"-jobTriggerOnLoad"?: boolean;
		uiState?: string;
		"-jobClass"?: string;
		pixel?: string;
		pixelParameters?: string;
	};
	/** @source Semoss/src/prerna/reactor/EmbeddedRoutineReactor.java#execute */
	EmbeddedRoutine: NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/EmbeddedScriptReactor.java#execute */
	EmbeddedScript: unknown;
	/** @source Semoss/src/prerna/usertracking/reactors/EngineAuditEventsReactor.java#execute */
	EngineAuditEvents: {
		events: ResourceAuditEvent[];
		hasNextPage: boolean;
		page: number;
		pageSize: number;
	};
	/** @source Semoss/src/prerna/reactor/playwright/ExtractElementsDataForLLMReactor.java#execute */
	ExtractElementsDataForLLM:
		| {
				html?: string;
				elements?: unknown[];
				elementCount?: number;
				interactiveCount?: number;
				bounds?: {
					startX?: number;
					startY?: number;
					endX?: number;
					endY?: number;
				};
		  }
		| Record<string, unknown>
		| null;
	/** @source Semoss/src/prerna/reactor/notification/FetchAppNotificationsReactor.java#execute */
	FetchAppNotifications: NotificationWireOutput[];
	/** @source Semoss/src/prerna/reactor/notification/FetchNotificationsReactor.java#execute */
	FetchNotifications: NotificationWireOutput[];
	/** @source Semoss/src/prerna/reactor/playwright/FindPlaywrightRoomRecordingsReactor.java#execute */
	FindPlaywrightRoomRecordings: {
		query?: string;
		recordingCount?: unknown;
		recordings?: unknown[];
		selectionGuidance?: string;
	};
	/** @source Semoss/src/prerna/reactor/federation/FuzzyMergeReactor.java#execute */
	FuzzyMerge: FrameWireOutput;
	/** @source Semoss/src/prerna/reactor/playwright/GenerateInputValuesReactor.java#execute */
	GenerateInputValues:
		| {
				success?: boolean;
				rawResponse?: string;
				inputsJson?: string;
				sessionId?: string;
				roomId?: string;
				historyRoomId?: string;
				offset?: number;
				limit?: number;
				sortOrder?: string;
		  }
		| { success?: boolean; error?: string; rawResponse?: string };
	/** @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightAutomationGoalReactor.java#execute */
	GeneratePlaywrightAutomationGoal: {
		success?: boolean;
		goal?: string;
		engineId?: string;
		messageLimit?: number | null | number;
		error?: string;
	};
	/** @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightFieldActionsReactor.java#execute */
	GeneratePlaywrightFieldActions:
		| {
				success?: boolean;
				fields?: (Record<string, unknown> | null)[];
				pageUrl?: unknown;
				tabId?: string;
				engineId?: string;
				message?: string;
		  }
		| { success?: boolean; code?: string; error?: string | null | string };
	/** @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightRecordingMetadataReactor.java#execute */
	GeneratePlaywrightRecordingMetadata: {
		success?: boolean;
		engineId?: string;
		error?: string;
	} & {
		title?: string;
		intent?: string;
		description?: string;
		suggestedFileName?: string;
		confidence?: number | null | number;
	};
	/** @source Semoss/src/prerna/reactor/playwright/GeneratePlaywrightStepsReactor.java#execute */
	GeneratePlaywrightSteps:
		| { rawResponse?: string; stepsJson?: string; success?: boolean }
		| { success?: boolean; error?: string; rawResponse?: string };
	/** @source Semoss/src/prerna/reactor/algorithms/xray/GenerateXRayHashingReactor.java#execute */
	GenerateXRayHashing:
		| ({
				files?: string[];
				status?: string[];
				databaseIds?: (string | null)[];
		  } & string)
		| null
		| (string & string)
		| null;
	/** @source Semoss/src/prerna/reactor/algorithms/xray/GenerateXRayHashingFrameReactor.java#execute */
	GenerateXRayHashingFrame:
		| ({
				files?: (string | null)[];
				status?: (string | null)[];
				frameNames?: (string | null)[];
		  } & string)
		| null
		| (string & string)
		| null;
	/** @source Semoss/src/prerna/reactor/GenericReactor.java#execute */
	Generic: "no output";
	/** @source Semoss/src/prerna/reactor/interceptor/GenericGuardrailInputReactor.java#execute */
	GenericGuardrailInput: Record<string, unknown> & {
		interim_result: {
			interceptor: string;
			pass: boolean;
			passDetails: GuardrailValue | string;
			masked: boolean;
			shortCircuitResponse?: string;
			closeRoom?: boolean;
			blockErrorMessage?: string;
		};
	};
	/** @source Semoss/src/prerna/reactor/interceptor/GenericGuardrailOutputReactor.java#execute */
	GenericGuardrailOutput: Record<string, unknown> & {
		interim_result: {
			interceptor: string;
			returnPrompt?: string;
			fullDetails?: unknown;
			guardrailEngineParams: Record<string, unknown>;
			pass: boolean;
			closeRoom?: boolean;
			blockErrorMessage?: string;
		};
	};
	/** @source Semoss/src/prerna/reactor/agent/GetAgentActivityLogReactor.java#execute */
	GetAgentActivityLog: AgentRunOutput[] | Record<string, AgentRunOutput[]>;
	/** @source Semoss/src/prerna/reactor/agent/metrics/GetAgentEffectivenessReactor.java#execute */
	GetAgentEffectiveness: {
		roomId?: string;
		rollup: AgentEffectivenessRollup;
		roomInference: RoomInferenceStats;
		runs: (
			| AgentRunMetrics
			| Pick<
					AgentRunMetrics,
					"runId" | "status" | "harnessType" | "score"
			  >
		)[];
	};
	/** @source Semoss/src/prerna/reactor/agent/GetAgentRunReactor.java#execute */
	GetAgentRun: AgentRunOutput;
	/** @source Semoss/src/prerna/reactor/agent/GetAgentRunActionReactor.java#execute */
	GetAgentRunAction: AgentActionOutput;
	/** @source Semoss/src/prerna/reactor/agent/GetAgentRunsForRoomReactor.java#execute */
	GetAgentRunsForRoom: AgentRunOutput[];
	/** @source Semoss/src/prerna/reactor/playwright/GetAllStepsReactor.java#execute */
	GetAllSteps: {
		steps: Record<string, PlaywrightStepOutput[]>;
		success: boolean;
		sessionId: string;
	};
	/** @source Semoss/src/prerna/reactor/playwright/GetAllStepsWithoutSessionReactor.java#execute */
	GetAllStepsWithoutSession: {
		steps: Record<string, PlaywrightStepOutput[]>;
		success: boolean;
	};
	/** @source Semoss/src/prerna/reactor/insights/GetAppConfigReactor.java#execute */
	GetAppConfig: unknown;
	/** @source Semoss/src/prerna/util/git/reactors/GetAssetCommentReactor.java#execute */
	GetAssetComment:
		| string
		| { date: string; user?: string; message?: string; id: string }[];
	/** @source Semoss/src/prerna/reactor/agent/GetAssignedDelegationsReactor.java#execute */
	GetAssignedDelegations: ({
		actionId?: string;
		status?: string;
		roomId?: string;
		requester?: JsonObject;
		requesterName?: string;
		response?: string;
		dateCreated?: string;
		decidedAt?: string;
	} & JsonObject)[];
	/** @source Semoss/src/prerna/logging/GetAuditLogsReportFilterOptionListReactor.java#execute */
	GetAuditLogsReportFilterOptionList: ([string] | [string, string, string])[];
	/** @source Semoss/src/prerna/reactor/automation/definition/GetAutomationReactor.java#execute */
	GetAutomation: {
		nodeSources?: Record<string, string | null>;
		sourceHashes?: Record<string, string | null>;
		revision?: string;
		globals?: Record<string, JsonValue> | null | Record<string, never>;
		scopeVariables?: Record<
			string,
			(Record<string, JsonValue> | null)[] | null
		>;
	} & { graph?: JsonObject; [key: string]: JsonValue | undefined };
	/** @source Semoss/src/prerna/reactor/automation/agent/GetAutomationAgentRunReactor.java#execute */
	GetAutomationAgentRun: AgentRunOutput & {
		canControl: boolean;
		projectId: string;
	};
	/** @source Semoss/src/prerna/reactor/automation/definition/GetAutomationNodeDefinitionsReactor.java#execute */
	GetAutomationNodeDefinitions: {
		schemaVersion?: number;
		nodes?: {
			type?: string;
			category?: JsonValue;
			label?: string;
			description?: string;
			defaultCodeMode?: string;
			requiredPermission?: string;
			supportsOutput?: boolean;
			supportsCustomCode?: boolean;
			engineType?: string;
			defaultConfig?: Record<string, JsonValue>;
			configSchema?: Record<string, JsonValue>;
			outputSchema?: Record<string, JsonValue>;
			inputs?: {
				id?: string;
				label?: string;
				kind?: JsonValue;
				direction?: JsonValue;
				dataType?: string;
			}[];
			outputs?: {
				id?: string;
				label?: string;
				kind?: JsonValue;
				direction?: JsonValue;
				dataType?: string;
			}[];
		}[];
	};
	/** @source Semoss/src/prerna/reactor/automation/run/GetAutomationResultReactor.java#execute */
	GetAutomationResult: AutomationSavedResultOutput & {
		schema: JsonValue[];
		rows: JsonValue[];
		offset: number;
		nextOffset: number;
		hasMore: boolean;
	};
	/** @source Semoss/src/prerna/reactor/automation/run/GetAutomationRunReactor.java#execute */
	GetAutomationRun: AutomationRunOutput;
	/** @source Semoss/src/prerna/reactor/automation/run/GetAutomationRunSourceReactor.java#execute */
	GetAutomationRunSource: {
		RUN_ID?: string;
		NODE_ID?: string;
		viewKind?: string;
		legacyPython?: boolean;
		nodeType?: string | null | string;
		sourceIdentity?: string;
		sourceNodeId?: string;
		historicalNodeType?: null | string;
		SOURCE_CODE?: null | string;
		config?: Record<string, JsonValue> | null | Record<string, JsonValue>;
		implementationId?: string;
		definitionHash?: string;
	};
	/** @source Semoss/src/prerna/reactor/algorithms/xray/GetCSVSchemaReactor.java#execute */
	GetCSVSchema: {
		databaseName: string;
		relationships: Record<string, never[]>;
		tables: Record<string, { name?: string; type: string }>;
	};
	/** @source Semoss/src/prerna/reactor/agent/GetClaudeCodeTranscriptHistoryReactor.java#execute */
	GetClaudeCodeTranscriptHistory: ClaudeTranscriptEvent[];
	/** @source Semoss/src/prerna/reactor/blocks/GetClientBlocksReactor.java#execute */
	GetClientBlocks: (Record<string, JsonValue> | null)[] | null;
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetConceptPropertiesReactor.java#execute */
	GetConceptProperties: ConceptPropertiesOutput;
	/** @source Semoss/src/prerna/reactor/insights/GetConsolidateUIStateReactor.java#execute */
	GetConsolidateUIState: string[];
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/GetConsolidatedCodeExecutionReactor.java#execute */
	GetConsolidatedCodeExecution: string[];
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/GetCurrentRecipeReactor.java#execute */
	GetCurrentRecipe: {
		id?: string;
		expression?: string;
		error?: boolean;
		errorMessages?: (string | null)[];
		warning?: boolean;
		warningMessages?: (string | null)[];
	}[];
	/** @source Semoss/src/prerna/reactor/algorithms/dataquality/GetDQRulesReactor.java#execute */
	GetDQRules: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseConceptsReactor.java#execute */
	GetDatabaseConcepts: string[];
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseConnectionsReactor.java#execute */
	GetDatabaseConnections: {
		database_id?: string;
		database_name?: string;
		table?: string;
		pk?: boolean;
		dataType?: string;
		type?: string;
		equivTable?: string;
		equivColumn?: string;
		equivPk?: boolean;
		column?: string;
		relName?: string;
	}[];
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseListReactor.java#execute */
	GetDatabaseList: {
		app_id?: string;
		app_name?: string;
		app_type?: string;
		app_subtype?: string;
		app_cost?: string;
		database_id?: string;
		database_name?: string;
		database_type?: string;
		low_database_name?: string;
	}[];
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseMetamodelReactor.java#execute */
	GetDatabaseMetamodel: {
		nodes: { conceptualName?: string; propSet: string[] }[];
		edges: {
			source: string;
			target: string;
			relation: string;
			sourceColumn?: string;
			targetColumn?: string;
		}[];
		physicalTypes: Record<string, string>;
		dataTypes: Record<string, string>;
		additionalDataTypes: Record<string, string>;
		logicalNames?: Record<string, (string | null)[]>;
		descriptions?: Record<string, string>;
		positions?: JsonObject;
	};
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseSelectorsReactor.java#execute */
	GetDatabaseSelectors: string[];
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseTableStructureReactor.java#execute */
	GetDatabaseTableStructure: [
		string | null,
		string | null,
		string | null,
		boolean,
		string | null,
		string | null,
	][];
	/** @source Semoss/src/prerna/reactor/utils/GetEngineUsageReactor.java#execute */
	GetEngineUsage: {
		type: string;
		label: string;
		code: string;
		parameters?: {
			required: boolean;
			name?: string;
			type?: string;
			description?: string;
		}[];
	};
	/** @source Semoss/src/prerna/poi/main/helper/excel/GetExcelFormReactor.java#execute */
	GetExcelForm: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetFrameDatabaseJoinsReactor.java#execute */
	GetFrameDatabaseJoins: Record<
		string,
		Record<string, (string | null)[] | null> | null
	> | null;
	/** @source Semoss/src/prerna/reactor/agent/mcp/GetFunctionsInMCPDriverReactor.java#execute */
	GetFunctionsInMCPDriver: string[];
	/** @source Semoss/src/prerna/reactor/agent/GetGitHubCopilotTranscriptHistoryReactor.java#execute */
	GetGitHubCopilotTranscriptHistory: CopilotTranscriptEvent[];
	/** @source Semoss/src/prerna/reactor/insights/GetInsightConfigReactor.java#execute */
	GetInsightConfig: unknown;
	/** @source Semoss/src/prerna/reactor/workflow/GetInsightDatasourcesReactor.java#execute */
	GetInsightDatasources: {
		expression: string;
		type: "Database" | "FileRead" | "GoogleSheetSource";
		pixelStepIndex: number;
		params: Record<string, unknown[]> & { qsColumns?: string[] };
	}[];
	/** @source Semoss/src/prerna/reactor/insights/GetInsightFrameStructureReactor.java#execute */
	GetInsightFrameStructure: [
		string,
		string,
		string | null,
		string | null,
		string | null,
		string | null,
		string | null,
	][];
	/** @source Semoss/src/prerna/reactor/insights/GetInsightMetamodelReactor.java#execute */
	GetInsightMetamodel: Record<
		string,
		{
			edges: never[];
			propSet: string[];
			additionalDataTypes: Record<string, string>;
			dataTypes: Record<string, string>;
		}
	>;
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/GetInsightParametersReactor.java#execute */
	GetInsightParameters: InsightParameterOutput[];
	/** @source Semoss/src/prerna/reactor/insights/GetInsightUserAccessRequestReactor.java#execute */
	GetInsightUserAccessRequest: (ResourceOutputTypes["GetProjectUserAccessRequest"][number] & {
		INSIGHTID?: string;
	})[];
	/** @source Semoss/src/prerna/io/connector/jira/GetJiraConnectionsReactor.java#execute */
	GetJiraConnections: { id?: string; alias?: string }[];
	/** @source Semoss/src/prerna/reactor/algorithms/xray/GetLocalSchemaReactor.java#execute */
	GetLocalSchema: {
		databaseName?: string;
		tables: Record<string, { name?: string; type: string }[]>;
	};
	/** @source Semoss/src/prerna/reactor/agent/mcp/GetMCPPromptsReactor.java#execute */
	GetMCPPrompts: {
		prompts?: JsonValue;
		[key: string]: JsonValue | undefined;
	};
	/** @source Semoss/src/prerna/reactor/agent/mcp/GetMCPResourcesReactor.java#execute */
	GetMCPResources: {
		resources?: JsonValue;
		[key: string]: JsonValue | undefined;
	};
	/** @source Semoss/src/prerna/reactor/agent/mcp/GetMCPResourcesTemplatesReactor.java#execute */
	GetMCPResourcesTemplates: {
		resourceTemplates?: JsonValue;
		[key: string]: JsonValue | undefined;
	};
	/** @source Semoss/src/prerna/reactor/agent/mcp/GetMCPToolsReactor.java#execute */
	GetMCPTools: {
		tools?: JsonObject[];
		_meta?: JsonObject;
		[key: string]: JsonValue | undefined;
	};
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetMetaTagsReactor.java#execute */
	GetMetaTags: (string | null)[];
	/** @source Semoss/src/prerna/reactor/algorithms/GetNLPVizOptionsReactor.java#execute */
	GetNLPVizOptions: string[] | (string | null)[] | null;
	/** @source Semoss/src/prerna/reactor/panel/GetPanelCollectReactor.java#execute */
	GetPanelCollect: { panelId?: string; numCollect?: number };
	/** @source Semoss/src/prerna/reactor/panel/rules/GetPanelColorByValueReactor.java#execute */
	GetPanelColorByValue: {
		panelId: string;
		name: string;
		filterInfo: FormattedFilterOutput[];
		havingInfo: FormattedFilterOutput[];
		options?: JsonObject;
	}[];
	/** @source Semoss/src/prerna/reactor/panel/filter/GetPanelFiltersReactor.java#execute */
	GetPanelFilters: FormattedFilterOutput[];
	/** @source Semoss/src/prerna/reactor/panel/filter/GetPanelFiltersQSReactor.java#execute */
	GetPanelFiltersQS: QueryStructWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/sort/GetPanelSortReactor.java#execute */
	GetPanelSort: QuerySortWireOutput[] | null;
	/** @source Semoss/src/prerna/reactor/panel/GetPanelStateReactor.java#execute */
	GetPanelState: PanelWireOutput | string;
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/GetPipelineReactor.java#execute */
	GetPipeline: {
		idMapping?: PixelWireOutput[];
		pixelParsing?: (
			| ({
					rowInputs?: (Record<string, unknown> | null)[];
					nounInputs?: Record<
						string,
						(Record<string, unknown> | null)[] | null
					>;
					opName?: string;
					opString?: string;
					widgetId?: string;
			  } | null)[]
			| null
		)[];
	};
	/** @source Semoss/src/prerna/playground/reactors/GetPlaygroundMessagesReactor.java#execute */
	GetPlaygroundMessages: ModelMessage[];
	/** @source Semoss/src/prerna/playground/reactors/GetPlaygroundRoomsReactor.java#execute */
	GetPlaygroundRooms: ResourceOutputTypes["GetUserConversationRooms"];
	/** @source Semoss/src/prerna/reactor/legacy/playsheets/GetPlaysheetParamsReactor.java#execute */
	GetPlaysheetParams: {
		result: string;
		options?: Record<string, unknown[] | "">;
		params?: Record<string, LegacyInsightParameter>;
	};
	/** @source Semoss/src/prerna/reactor/playwright/GetPlaywrightScriptVariablesReactor.java#execute */
	GetPlaywrightScriptVariables: {
		label?: string;
		text?: string;
		isPassword: boolean;
	}[];
	/** @source Semoss/src/prerna/reactor/prompt/GetPromptReactor.java#execute */
	GetPrompt: PromptOutput;
	/** @source Semoss/src/prerna/reactor/prompt/GetPromptMetaValuesReactor.java#execute */
	GetPromptMetaValues: {
		metakey?: string;
		metavalue?: string;
		count?: number;
	}[];
	/** @source Semoss/src/prerna/reactor/prompt/GetPromptWithVersionsReactor.java#execute */
	GetPromptWithVersions: (PromptOutput & { is_latest?: boolean })[];
	/** @source Semoss/src/prerna/reactor/insights/GetQueriedDatabasesReactor.java#execute */
	GetQueriedDatabases: (string | null)[];
	/** @source Semoss/src/prerna/io/connector/salesforce/GetSalesforceConnectionsReactor.java#execute */
	GetSalesforceConnections: { id?: string; alias?: string }[];
	/** @source Semoss/src/prerna/io/connector/servicenow/GetServiceNowConnectionsReactor.java#execute */
	GetServiceNowConnections: {
		id?: string;
		alias?: string;
		instanceUrl?: string;
		userProfileUrl?: string;
	}[];
	/** @source Semoss/src/prerna/reactor/sheet/GetSheetStateReactor.java#execute */
	GetSheetState: SheetWireOutput | string;
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetSpecificConceptPropertiesReactor.java#execute */
	GetSpecificConceptProperties: string[];
	/** @source Semoss/src/prerna/reactor/guardrail/GetSqlQueryPolicyDefaultsReactor.java#execute */
	GetSqlQueryPolicyDefaults: Record<
		string,
		Record<string, string | null> | null
	> | null;
	/** @source Semoss/src/prerna/reactor/agent/GetSubagentRunsReactor.java#execute */
	GetSubagentRuns: (AgentRunOutput & {
		executorType: "HUMAN" | "AGENT";
		executorLabel?: string;
	})[];
	/** @source Semoss/src/prerna/io/connector/surveymonkey/GetSurveyMonkeySurveysReactor.java#execute */
	GetSurveyMonkeySurveys: { name?: string; id?: string }[];
	/** @source Semoss/src/prerna/reactor/masterdatabase/GetTraversalOptionsReactor.java#execute */
	GetTraversalOptions: {
		connectedConcepts?: Record<
			string,
			Record<
				string,
				{
					equivalentConcept: string;
					upstream?: string[];
					downstream?: string[];
					physical?: string[];
				}
			>
		>;
		connectedProperties?: ConceptPropertiesOutput;
	};
	/** @source Semoss/src/prerna/reactor/utils/GetUserActiveSavedInsightsReactor.java#execute */
	GetUserActiveSavedInsights: null | Record<
		string,
		(string | null)[] | null
	> | null;
	/** @source Semoss/src/prerna/usertracking/reactors/GetUserEngineVotesReactor.java#execute */
	GetUserEngineVotes:
		| boolean
		| { userVote?: number; total?: number | Record<string, number | null> };
	/** @source Semoss/src/prerna/reactor/algorithms/xray/GetXLSchemaReactor.java#execute */
	GetXLSchema: {
		databaseName: string;
		relationships: Record<string, never[]>;
		tables: Record<string, { name?: string; type: string }>;
	};
	/** @source Semoss/src/prerna/reactor/algorithms/xray/GetXrayConfigListReactor.java#execute */
	GetXrayConfigList: { configList?: { fileName?: string }[] };
	/** @source Semoss/src/prerna/io/connector/github/GitHubBranchReactor.java#execute */
	GitHubBranch:
		| {
				name?: null | string;
				protected?: JsonValue;
				commit_sha?: null | string;
		  }[]
		| { ref?: JsonValue; sha?: JsonValue; message?: string }
		| { success?: boolean; message?: string };
	/** @source Semoss/src/prerna/io/connector/github/GitHubCheckInstallationReactor.java#execute */
	GitHubCheckInstallation: {
		project?: string | null | string;
		repo?: JsonValue;
		installationId?: string;
		installationValid?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/github/GitHubIssueReactor.java#execute */
	GitHubIssue:
		| {
				number?: JsonValue;
				title?: null | string;
				state?: null | string;
				user?: null | string;
				assignees?: (null | string)[];
				labels?: (null | string)[];
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
				comments?: JsonValue;
		  }[]
		| ({
				body?: null | string;
				state_reason?: null | string;
				closed_at?: null | string;
				milestone?: {
					number?: JsonValue;
					title?: null | string;
					state?: null | string;
					due_on?: null | string;
				};
		  } & {
				number?: JsonValue;
				title?: null | string;
				state?: null | string;
				user?: null | string;
				assignees?: (null | string)[];
				labels?: (null | string)[];
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
				comments?: JsonValue;
		  })
		| {
				id?: JsonValue;
				user?: null | string;
				body?: null | string;
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
		  }[]
		| {
				number?: JsonValue;
				title?: null | string;
				state?: null | string;
				html_url?: null | string;
		  }
		| {
				id?: JsonValue;
				user?: null | string;
				body?: null | string;
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
		  }
		| { success?: boolean; message?: string }
		| {
				total_count?: JsonValue;
				incomplete_results?: JsonValue;
				items?: {
					number?: JsonValue;
					title?: null | string;
					state?: null | string;
					user?: null | string;
					html_url?: null | string;
					created_at?: null | string;
					repository_url?: null | string;
				}[];
		  }
		| {
				name?: null | string;
				color?: null | string;
				description?: null | string;
		  }[]
		| {
				login?: null | string;
				avatar_url?: null | string;
				role_name?: null | string;
		  }[];
	/** @source Semoss/src/prerna/io/connector/github/GitHubPullProjectReactor.java#execute */
	GitHubPullProject: {
		project?: string | null | string;
		repo?: string;
		success?: JsonValue;
		mergeStatus?: string;
		rebaseStatus?: string;
	};
	/** @source Semoss/src/prerna/io/connector/github/GitHubPullRequestReactor.java#execute */
	GitHubPullRequest:
		| {
				number?: JsonValue;
				title?: null | string;
				state?: null | string;
				user?: null | string;
				head_ref?: null | string;
				head_sha?: null | string;
				base_ref?: null | string;
				draft?: JsonValue;
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
		  }[]
		| ({
				body?: null | string;
				mergeable?: null | boolean;
				merged?: JsonValue;
				additions?: JsonValue;
				deletions?: JsonValue;
				changed_files?: JsonValue;
				requested_reviewers?: (null | string)[];
		  } & {
				number?: JsonValue;
				title?: null | string;
				state?: null | string;
				user?: null | string;
				head_ref?: null | string;
				head_sha?: null | string;
				base_ref?: null | string;
				draft?: JsonValue;
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
		  })
		| {
				filename?: null | string;
				status?: null | string;
				additions?: JsonValue;
				deletions?: JsonValue;
				changes?: JsonValue;
				patch?: null | string;
		  }[]
		| {
				id?: JsonValue;
				user?: null | string;
				body?: null | string;
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
		  }[]
		| {
				number?: JsonValue;
				title?: null | string;
				state?: null | string;
				draft?: JsonValue;
				html_url?: null | string;
		  }
		| {
				id?: JsonValue;
				user?: null | string;
				body?: null | string;
				created_at?: null | string;
				updated_at?: null | string;
				html_url?: null | string;
		  }
		| { success?: boolean; message?: string }
		| {
				total_count?: JsonValue;
				incomplete_results?: JsonValue;
				items?: {
					number?: JsonValue;
					title?: null | string;
					state?: null | string;
					user?: null | string;
					html_url?: null | string;
					created_at?: null | string;
					updated_at?: null | string;
					repository_url?: null | string;
					pull_request_url?: null | string;
				}[];
		  }
		| {
				name?: null | string;
				color?: null | string;
				description?: null | string;
		  }[]
		| {
				login?: null | string;
				avatar_url?: null | string;
				role_name?: null | string;
		  }[];
	/** @source Semoss/src/prerna/io/connector/github/GitHubPushProjectReactor.java#execute */
	GitHubPushProject: {
		project?: string | null | string;
		repo?: string;
		success?: boolean;
		updates?: string[];
	};
	/** @source Semoss/src/prerna/io/connector/github/GitHubRepoReactor.java#execute */
	GitHubRepo:
		| {
				id?: JsonValue;
				name?: null | string;
				full_name?: null | string;
				description?: null | string;
				private?: JsonValue;
				html_url?: null | string;
				default_branch?: null | string;
				language?: null | string;
				updated_at?: null | string;
				stargazers_count?: JsonValue;
				owner?: null | string;
		  }[]
		| {
				total_count?: JsonValue;
				incomplete_results?: JsonValue;
				items?: {
					id?: JsonValue;
					name?: null | string;
					full_name?: null | string;
					description?: null | string;
					private?: JsonValue;
					html_url?: null | string;
					default_branch?: null | string;
					language?: null | string;
					updated_at?: null | string;
					stargazers_count?: JsonValue;
					owner?: null | string;
				}[];
		  }
		| {
				login?: null | string;
				description?: null | string;
				avatar_url?: null | string;
		  }[];
	/** @source Semoss/src/prerna/io/connector/github/GitHubUserReactor.java#execute */
	GitHubUser: {
		login?: null | string;
		name?: null | string;
		email?: null | string;
		bio?: null | string;
		avatar_url?: null | string;
		public_repos?: JsonValue;
		followers?: JsonValue;
		following?: JsonValue;
		html_url?: null | string;
		created_at?: null | string;
		company?: null | string;
		location?: null | string;
	};
	/** @source Semoss/src/prerna/io/connector/github/GitHubWebhookDeliveriesReactor.java#execute */
	GitHubWebhookDeliveries: {
		count?: number;
		deliveries?:
			| {
					id?: number;
					guid?: string;
					event?: string;
					action?: string;
					status?: string;
					statusCode?: number;
					deliveredAt?: string;
					duration?: number;
					redelivery?: boolean;
					installationId?: number;
					repositoryId?: number;
			  }[]
			| (Record<string, JsonValue> | null)[];
	};
	/** @source Semoss/src/prerna/util/git/gitlab/GitlabListBranchesForProjectReactor.java#execute */
	GitlabListBranchesForProject: JsonValue[] | null;
	/** @source Semoss/src/prerna/util/git/gitlab/GitlabListJobsForProjectReactor.java#execute */
	GitlabListJobsForProject: JsonValue[] | null;
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarCreateEventReactor.java#execute */
	GoogleCalendarCreateEvent: CalendarEventOutput;
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarDeleteEventReactor.java#execute */
	GoogleCalendarDeleteEvent: { id?: string; deleted?: boolean };
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarGetEventReactor.java#execute */
	GoogleCalendarGetEvent: CalendarEventOutput & { when?: string };
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarGetScheduleReactor.java#execute */
	GoogleCalendarGetSchedule: {
		start?: null | string;
		end?: null | string;
		schedules?: {
			address?: string;
			busy?: {
				start?: null | string;
				end?: null | string;
				status?: string;
				subject?: string;
				location?: string;
			}[];
			error?: string;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarListCalendarsReactor.java#execute */
	GoogleCalendarListCalendars: {
		offset?: number;
		count?: number;
		hasMore?: boolean;
		calendars?: {
			id?: string;
			name?: string;
			color?: string;
			owner?: string;
			ownerName?: string;
			canEdit?: boolean;
			canShare?: boolean;
			canViewPrivateItems?: boolean;
			isDefaultCalendar?: boolean;
			isSharedWithMe?: boolean;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarListEventsReactor.java#execute */
	GoogleCalendarListEvents: {
		start: string;
		end: string;
		offset: number;
		count: number;
		hasMore: boolean;
		truncated?: boolean;
		nextOffset?: number;
		events: CalendarEventOutput[];
	};
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarListPermissionsReactor.java#execute */
	GoogleCalendarListPermissions: {
		calendarId?: string;
		mailbox?: string;
		offset?: number;
		count?: number;
		hasMore?: boolean;
		permissions?: {
			id?: string;
			role?: string;
			address?: string;
			name?: string;
			allowedRoles?: (string | null)[];
			isInsideOrganization?: boolean;
			isRemovable?: boolean;
			isDelegate?: boolean;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarRespondToEventReactor.java#execute */
	GoogleCalendarRespondToEvent: {
		id?: string;
		response?: string;
		sendResponse?: boolean | null | boolean;
	};
	/** @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarUpdateEventReactor.java#execute */
	GoogleCalendarUpdateEvent: CalendarEventOutput;
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDocsCreate: { id?: JsonValue; success?: boolean };
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDocsDelete: { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDocsList: { title?: string; id?: string }[];
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDocsRead: { title?: string; content?: string };
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDocsUpdate: { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDriveDelete: { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDriveDownload: { success?: boolean; id?: string };
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDriveList: (Record<string, JsonValue> | null)[] | null;
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDriveRead: { id?: JsonValue } & string;
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleDriveUpload: { id?: JsonValue; success?: boolean };
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailDeleteMailReactor.java#execute */
	GoogleGmailDeleteMail: { deleted?: boolean; id?: string };
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailDownloadAttachmentReactor.java#execute */
	GoogleGmailDownloadAttachment: {
		id?: string;
		attachmentId?: string;
		name?: string;
		filePath?: null | string | null | string;
		size?: JsonValue;
		success?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailForwardMailReactor.java#execute */
	GoogleGmailForwardMail: { forwarded?: string } & ({
		draft?: boolean;
		sent?: boolean;
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	});
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailGetMailReactor.java#execute */
	GoogleGmailGetMail: MailMessageOutput;
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailListMailReactor.java#execute */
	GoogleGmailListMail: {
		folder?: string;
		conversationId?: string;
		offset: number;
		count: number;
		hasMore: boolean;
		messages: MailMessageOutput[];
	};
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailListMailFoldersReactor.java#execute */
	GoogleGmailListMailFolders: {
		offset?: number;
		count?: number;
		hasMore?: boolean;
		folders?: {
			id?: string;
			name?: string;
			kind?: string;
			totalCount?: number;
			unreadCount?: number;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailMarkMailReadReactor.java#execute */
	GoogleGmailMarkMailRead: {
		id?: string;
		read?: boolean | null | boolean;
		unread?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/mail/AbstractMoveMailReactor.java#executeAuthenticated */
	GoogleGmailMoveMail: {
		moved?: boolean;
		previousId?: string;
		id?: string;
		folder?: string;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	GoogleGmailProfileById: {
		emailAddress?: JsonValue;
		messagesTotal?: JsonValue;
		threadsTotal?: JsonValue;
		historyId?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailReplyMailReactor.java#execute */
	GoogleGmailReplyMail: {
		repliedTo?: string;
		replyAll?: boolean | null | boolean;
	} & ({ draft?: boolean; sent?: boolean } & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	});
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailSaveDraftReactor.java#execute */
	GoogleGmailSaveDraft: { draft?: boolean } & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailSendDraftReactor.java#execute */
	GoogleGmailSendDraft: { draftId?: string } & ({
		draft?: boolean;
		sent?: boolean;
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	});
	/** @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailSendMailReactor.java#execute */
	GoogleGmailSendMail: { sent?: boolean } & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	};
	/** @source Semoss/src/prerna/reactor/planner/GraphPlanReactor.java#execute */
	GraphPlan: "no output";
	/** @source Semoss/src/prerna/reactor/util/GzipFileReactor.java#execute */
	GzipFile: { fileName?: string; sourceSize?: string; size?: string };
	/** @source Semoss/src/prerna/reactor/utils/HelpJsonReactor.java#execute */
	HelpJson: {
		General?: (string | null)[];
		R?: (string | null)[];
		PYTHON?: (string | null)[];
		H2?: (string | null)[];
		NATIVE?: (string | null)[];
		TINKER?: (string | null)[];
		EXPRESSION?: (string | null)[];
	};
	/** @source Semoss/src/prerna/reactor/playwright/ImageContextReactor.java#execute */
	ImageContext: { response?: string | null | string };
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/ImportParamOptionsReactor.java#execute */
	ImportParamOptions: {
		baseQsType?: string;
		qsType?:
			| "ENGINE"
			| "FRAME"
			| "CSV_FILE"
			| "EXCEL_FILE"
			| "PARQUET_FILE"
			| "RAW_ENGINE_QUERY"
			| "RAW_JDBC_ENGINE_QUERY"
			| "RAW_RDF_FILE_ENGINE_QUERY"
			| "RAW_FRAME_QUERY"
			| "DIRECT_API_QUERY"
			| "LAMBDA";
		appId?: string;
		databaseId?: string;
		pixelId?: string;
		pixelString?: string;
		params?: Record<
			string,
			Record<
				string,
				Record<
					string,
					Record<
						string,
						| ({
								detailsList?: ({
									baseQsType?: "SQS" | "HQS";
									parameterFillType?: "DATASOURCE" | "FILTER";
									appId?: string;
									databaseId?: string;
									pixelId?: string;
									pixelString?: string;
									tableName?: string;
									tableAlias?: string;
									columnName?: string;
									currentValue?: unknown;
									operator?: string;
									type?:
										| "CONST_DECIMAL"
										| "CONST_INT"
										| "CONST_STRING"
										| "CONST_DATE"
										| "CONST_TIMESTAMP"
										| "CONST_DAY"
										| "CONST_WEEK"
										| "CONST_MONTH"
										| "CONST_YEAR"
										| "NULL_VALUE"
										| "VECTOR"
										| "MAP"
										| "BOOLEAN"
										| "ERROR"
										| "SUB_QUERY_EXPRESSION"
										| "COLUMN"
										| "TASK"
										| "TASK_LIST"
										| "REMOVE_VARIABLE"
										| "REMOVE_TASK"
										| "REMOVE_LAYER"
										| "DROP_INSIGHT"
										| "SHEET"
										| "PANEL"
										| "PANEL_CLONE_MAP"
										| "FILE_REFERENCE"
										| "FRAME"
										| "FRAME_MAP"
										| "BOOLEAN_METADATA"
										| "UPLOAD_RETURN_MAP"
										| "ORNAMENT_MAP"
										| "PARAM_STRUCT"
										| "PREAPPLIED_PARAM_STRUCT"
										| "SQLE"
										| "E"
										| "FILTER"
										| "COMPARATOR"
										| "JOIN"
										| "CODE"
										| "VARIABLE"
										| "QUERY_STRUCT"
										| "RAW_DATA_SET"
										| "FORMATTED_DATA_SET"
										| "ITERATOR"
										| "EXPORT"
										| "LAMBDA"
										| "ALIAS"
										| "IN_MEM_STORE"
										| "PLANNER"
										| "CACHED_CLASS"
										| "INVALID_SYNTAX"
										| "R_CONNECTION"
										| "R_ENGINE"
										| "STORAGE"
										| "MODEL"
										| "VECTORDB"
										| "PROJECT_EMAIL_SESSION"
										| "PROJECT_AUTHORIZATION_HEADER"
										| "PIXEL_OBJECT"
										| "JSON_OBJECT"
										| "CUSTOM_DATA_STRUCTURE"
										| "CACHED_PIXEL_RUNNER"
										| "PIXEL_RUNNER"
										| "PARAM_VALUES_MAP"
										| "MCP_TOOL_EXECUTION";
									level?:
										| "DATASOURCE"
										| "COLUMN"
										| "TABLE"
										| "OPERATOR"
										| "OPERATORU";
									quote?: "NO" | "SINGLE" | "DOUBLE";
									uOperator?: string;
									context?: string;
									contextPart?: string;
									defQuery?: string;
									importSource?: string;
								} | null)[];
								searchable: boolean;
								multiple: boolean;
								paramName?: string;
								appId?: string;
								databaseId?: string;
								modelQuery?: string;
								manualChoices?: unknown;
								modelDisplay?: string;
								modelLabel?: string;
								required: boolean;
								defaultValue?: unknown;
								populateInAudit: boolean;
								isPreApplied: boolean;
								fillType?: "MANUAL" | "PIXEL" | "QUERY";
						  } | null)[]
						| null
					> | null
				> | null
			> | null
		>;
	}[];
	/** @source Semoss/src/prerna/reactor/agent/mcp/InitMCPReactor.java#execute */
	InitMCP: {
		protocolVersion?: string;
		serverInfo?: {
			name?: string;
			version?: string;
			[key: string]: JsonValue | undefined;
		};
		capabilities?: JsonObject;
		[key: string]: JsonValue | undefined;
	};
	/** @source Semoss/src/prerna/reactor/panel/InsightPanelIds.java#execute */
	InsightPanelIds: string[];
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/InsightPixelListReactor.java#execute */
	InsightPixelList: PixelWireOutput[];
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/InsightRecipeReactor.java#execute */
	InsightRecipe:
		| { name?: string; core_engine?: string; core_engine_id?: string }
		| (string | null)[]
		| string;
	/** @source Semoss/src/prerna/reactor/export/InspectPptxReactor.java#execute */
	InspectPptx: PptxInspectionOutput;
	/** @source Semoss/src/prerna/reactor/insights/IsInsightParameterizedReactor.java#execute */
	IsInsightParameterized:
		| boolean
		| { hasParameter: boolean; viewOptionsMap?: JsonObject };
	/** @source Semoss/src/prerna/io/connector/jira/JiraAssignIssueReactor.java#execute */
	JiraAssignIssue: { jiraid?: string; assignee?: string; success?: boolean };
	/** @source Semoss/src/prerna/io/connector/jira/JiraAttachmentReactor.java#execute */
	JiraAttachment:
		| (
				| ({
						attachmentId?: string;
						created?: string;
						contentUrl?: string;
						author?: string | null | string;
				  } & string)
				| (null & string)
				| (null & number)
		  )[]
		| {
				attachmentId?: string;
				filename?: string;
				size?: number;
				success?: boolean;
		  }
		| { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/jira/JiraCommentReactor.java#execute */
	JiraComment:
		| (
				| ({
						commentId?: string;
						author?: string | null | string;
						created?: string;
						body?: string;
				  } & string)
				| null
		  )[]
		| {
				commentId?: string;
				author?: string | null | string;
				created?: string;
				success?: boolean;
		  }
		| {
				commentId?: string;
				author?: string | null | string;
				created?: string;
				updated?: string;
				success?: boolean;
		  }
		| { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/jira/JiraCreateIssueReactor.java#execute */
	JiraCreateIssue: { id?: string; jiraid?: string; success?: boolean };
	/** @source Semoss/src/prerna/io/connector/jira/JiraDeleteIssueReactor.java#execute */
	JiraDeleteIssue: { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/jira/JiraGetAssignableUsersReactor.java#execute */
	JiraGetAssignableUsers: (
		| ({ assignee?: string; displayName?: string } & string)
		| null
	)[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraGetCreateFieldsReactor.java#execute */
	JiraGetCreateFields: (
		| ({ name?: JsonValue; key?: JsonValue } & string)
		| (null &
				boolean &
				boolean &
				JsonValue &
				({
					id?: JsonValue;
					name?: JsonValue;
					key?: JsonValue;
				} & JsonValue)[])
	)[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraGetIssueLinkTypesReactor.java#execute */
	JiraGetIssueLinkTypes: (
		| ({ id?: string; linkType?: string } & string)
		| (null & string)
		| null
	)[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraGetPriorityReactor.java#execute */
	JiraGetPriority: { id?: string; name?: string }[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraGetProjectsReactor.java#execute */
	JiraGetProjects: (
		| ({
				id?: string;
				project?: string;
				name?: string;
				lead?: string | null | string;
		  } & string)
		| null
	)[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraGetTransitionsReactor.java#execute */
	JiraGetTransitions: (
		| ({ id?: string; name?: string } & string)
		| null
		| string
	)[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraGetUpdateFieldsReactor.java#execute */
	JiraGetUpdateFields: ({ fieldId?: string; name?: JsonValue } & boolean &
		JsonValue &
		({
			id?: JsonValue;
			name?: JsonValue;
			key?: JsonValue;
		} & JsonValue)[])[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraIssueLinkReactor.java#execute */
	JiraIssueLink:
		| {
				success?: boolean;
				linkType?: string;
				inwardIssue?: string;
				outwardIssue?: string;
		  }
		| { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/jira/JiraIssueTypeReactor.java#execute */
	JiraIssueType: ({ issuetypeid?: string; name?: string } & boolean)[];
	/** @source Semoss/src/prerna/io/connector/jira/JiraReadIssueReactor.java#execute */
	JiraReadIssue: { id?: string; jiraid?: string; fields?: JsonValue };
	/** @source Semoss/src/prerna/io/connector/jira/JiraSearchReactor.java#execute */
	JiraSearch: {
		issues?: { id?: string; jiraid?: string; fields?: JsonValue }[];
		maxResults?: number;
		nextPageToken?: string;
	} & JsonValue;
	/** @source Semoss/src/prerna/io/connector/jira/JiraUpdateIssueReactor.java#execute */
	JiraUpdateIssue: { jiraid?: string; success?: boolean };
	/** @source Semoss/src/prerna/io/connector/jira/JiraWorklogReactor.java#execute */
	JiraWorklog:
		| (
				| ({
						worklogId?: string;
						author?: string | null | string;
						created?: string;
						comment?: string;
				  } & string)
				| (null & number & string)
				| (null & string)
				| null
		  )[]
		| (
				| ({
						worklogId?: string;
						author?: string | null | string;
						created?: string;
						success?: boolean;
				  } & string)
				| (null & number)
		  )
		| (
				| ({
						worklogId?: string;
						author?: string | null | string;
						success?: boolean;
				  } & string)
				| (null & number & string)
				| null
		  )
		| { success?: boolean };
	/** @source Semoss/src/prerna/reactor/algorithms/JsonLogicReactor.java#execute */
	JsonLogic: JsonValue;
	/** @source Semoss/src/prerna/reactor/scheduler/ListAllJobsReactor.java#execute */
	ListAllJobs: Record<string, Record<string, string | null> | null> | null;
	/** @source Semoss/src/prerna/reactor/automation/run/ListAutomationRunsReactor.java#execute */
	ListAutomationRuns: AutomationRunRow[];
	/** @source Semoss/src/prerna/reactor/venv/ListPackagesInVirtualEnvReactor.java#execute */
	ListPackagesInVirtualEnv: (Record<string, string | null> | null)[];
	/** @source Semoss/src/prerna/reactor/playwright/ListPlaywrightScriptsReactor.java#execute */
	ListPlaywrightScripts: string[];
	/** @source Semoss/src/prerna/reactor/prompt/ListPromptReactor.java#execute */
	ListPrompt: PromptOutput[];
	/** @source Semoss/src/prerna/reactor/agent/skill/ListSkillFilesReactor.java#execute */
	ListSkillFiles: { filePath: string; name: string; description: string }[];
	/** @source Semoss/src/prerna/reactor/agent/skill/ListSkillsReactor.java#execute */
	ListSkills: {
		name?: string;
		path?: string;
		directory?: string;
		description?: string;
		content?: string;
		files?: { path?: string; directory?: string; content?: string }[];
	}[];
	/** @source Semoss/src/prerna/reactor/ListVarReactor.java#execute */
	ListVar: (string | null)[];
	/** @source Semoss/src/prerna/reactor/livekit/LiveKitJoinRoomReactor.java#execute */
	LiveKitJoinRoom: {
		jwt?: string;
		room_id?: string | null | string;
		insightId?: string;
	};
	/** @source Semoss/src/prerna/reactor/livekit/LiveKitListRoomsAdminReactor.java#execute */
	LiveKitListRoomsAdmin: unknown[] | null;
	/** @source Semoss/src/prerna/reactor/planner/AbstractLoadClient.java#execute */
	LoadClient: {
		g?: unknown;
		roots?: unknown[];
		varStore?: Record<string, SerializedNounMetadata>;
	} | null;
	/** @source Semoss/src/prerna/reactor/insights/LoadInsightReactor.java#execute */
	LoadInsight:
		| {
				name?: string;
				app_id?: string;
				app_name?: string;
				app_insight_id?: string;
				core_engine?: string;
				core_engine_id?: string;
				layout?: string;
		  }
		| PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/date/reactor/MonthReactor.java#execute */
	MONTH: { numMonths: number };
	/** @source Semoss/src/prerna/reactor/agent/mcp/MakeEngineMCPReactor.java#execute */
	MakeEngineMCP: McpDocument;
	/** @source Semoss/src/prerna/reactor/agent/mcp/MakeNotebookCellMCPReactor.java#execute */
	MakeNotebookCellMCP: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/agent/mcp/MakePixelMCPReactor.java#execute */
	MakePixelMCP: McpDocument;
	/** @source Semoss/src/prerna/reactor/playwright/MakePlaywrightMCPReactor.java#execute */
	MakePlaywrightMCP: McpDocument;
	/** @source Semoss/src/prerna/reactor/agent/mcp/MakePythonMCPReactor.java#execute */
	MakePythonMCP: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/agent/mcp/MakeRoomPixelMCPReactor.java#execute */
	MakeRoomPixelMCP: McpDocument;
	/** @source Semoss/src/prerna/reactor/playwright/MakeRoomPlaywrightMCPReactor.java#execute */
	MakeRoomPlaywrightMCP: McpDocument;
	/** @source Semoss/src/prerna/reactor/agent/mcp/MakeUserPixelMCPReactor.java#execute */
	MakeUserPixelMCP: McpDocument;
	/** @source Semoss/src/prerna/reactor/map/MapReactor.java#execute */
	Map: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/map/MapListReactor.java#execute */
	MapList: JsonValue[];
	/** @source Semoss/src/prerna/reactor/map/MapMapReactor.java#execute */
	MapMap: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarCreateEventReactor.java#execute */
	MicrosoftCalendarCreateEvent: CalendarEventOutput;
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarDeleteEventReactor.java#execute */
	MicrosoftCalendarDeleteEvent: { id?: string; deleted?: boolean };
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarGetEventReactor.java#execute */
	MicrosoftCalendarGetEvent: CalendarEventOutput & { when?: string };
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarGetScheduleReactor.java#execute */
	MicrosoftCalendarGetSchedule: {
		start?: null | string;
		end?: null | string;
		schedules?: {
			address?: string;
			busy?: {
				start?: null | string;
				end?: null | string;
				status?: string;
				subject?: string;
				location?: string;
			}[];
			error?: string;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarListCalendarsReactor.java#execute */
	MicrosoftCalendarListCalendars: {
		offset?: number;
		count?: number;
		hasMore?: boolean;
		calendars?: {
			id?: string;
			name?: string;
			color?: string;
			owner?: string;
			ownerName?: string;
			canEdit?: boolean;
			canShare?: boolean;
			canViewPrivateItems?: boolean;
			isDefaultCalendar?: boolean;
			isSharedWithMe?: boolean;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarListEventsReactor.java#execute */
	MicrosoftCalendarListEvents: {
		start: string;
		end: string;
		offset: number;
		count: number;
		hasMore: boolean;
		truncated?: boolean;
		nextOffset?: number;
		events: CalendarEventOutput[];
	};
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarListPermissionsReactor.java#execute */
	MicrosoftCalendarListPermissions: {
		calendarId?: string;
		mailbox?: string;
		offset?: number;
		count?: number;
		hasMore?: boolean;
		permissions?: {
			id?: string;
			role?: string;
			address?: string;
			name?: string;
			allowedRoles?: (string | null)[];
			isInsideOrganization?: boolean;
			isRemovable?: boolean;
			isDelegate?: boolean;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarRespondToEventReactor.java#execute */
	MicrosoftCalendarRespondToEvent: {
		id?: string;
		response?: string;
		sendResponse?: boolean | null | boolean;
	};
	/** @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarUpdateEventReactor.java#execute */
	MicrosoftCalendarUpdateEvent: CalendarEventOutput;
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveCreateFolder: {
		id?: JsonValue;
		name?: JsonValue;
		driveId?: string;
		isFolder?: boolean;
		size?: JsonValue;
		mimeType?: null | string;
		childCount?: JsonValue;
		webUrl?: JsonValue;
		path?: null | string | null | string;
		parentId?: string;
		createdDateTime?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		createdBy?: null | string;
		lastModifiedBy?: null | string;
		isShared?: boolean;
		sharedBy?: null | string;
		sharedByEmail?: null | string;
		sharedOwner?: null | string;
		sharedOwnerEmail?: null | string;
		sharedScope?: JsonValue;
		sharedDateTime?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveDeleteFile: {
		driveId?: string;
		itemId?: string;
		path?: string;
		success?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveDownloadFile: {
		id?: string;
		name?: string;
		driveId?: string;
		filePath?: string;
		size?: JsonValue;
		success?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveGetFile: {
		id?: JsonValue;
		name?: JsonValue;
		driveId?: string;
		isFolder?: boolean;
		size?: JsonValue;
		mimeType?: null | string;
		childCount?: JsonValue;
		webUrl?: JsonValue;
		path?: null | string | null | string;
		parentId?: string;
		createdDateTime?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		createdBy?: null | string;
		lastModifiedBy?: null | string;
		isShared?: boolean;
		sharedBy?: null | string;
		sharedByEmail?: null | string;
		sharedOwner?: null | string;
		sharedOwnerEmail?: null | string;
		sharedScope?: JsonValue;
		sharedDateTime?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveListDrives: (Record<string, JsonValue> | null)[] | null;
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveListFiles: {
		count?: number;
		files?: {
			id?: JsonValue;
			name?: JsonValue;
			driveId?: string;
			isFolder?: boolean;
			size?: JsonValue;
			mimeType?: null | string;
			childCount?: JsonValue;
			webUrl?: JsonValue;
			path?: null | string | null | string;
			parentId?: string;
			createdDateTime?: JsonValue;
			lastModifiedDateTime?: JsonValue;
			createdBy?: null | string;
			lastModifiedBy?: null | string;
			isShared?: boolean;
			sharedBy?: null | string;
			sharedByEmail?: null | string;
			sharedOwner?: null | string;
			sharedOwnerEmail?: null | string;
			sharedScope?: JsonValue;
			sharedDateTime?: JsonValue;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveListSharedFiles: {
		count?: number;
		files?: (Record<string, JsonValue> | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveSearchFiles: {
		search?: string;
		scope?: string | null | string;
		count?: number;
		files?:
			| {
					id?: JsonValue;
					name?: JsonValue;
					driveId?: string;
					isFolder?: boolean;
					size?: JsonValue;
					mimeType?: null | string;
					childCount?: JsonValue;
					webUrl?: JsonValue;
					path?: null | string | null | string;
					parentId?: string;
					createdDateTime?: JsonValue;
					lastModifiedDateTime?: JsonValue;
					createdBy?: null | string;
					lastModifiedBy?: null | string;
					isShared?: boolean;
					sharedBy?: null | string;
					sharedByEmail?: null | string;
					sharedOwner?: null | string;
					sharedOwnerEmail?: null | string;
					sharedScope?: JsonValue;
					sharedDateTime?: JsonValue;
			  }[]
			| (Record<string, JsonValue> | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveShareFile: {
		id?: JsonValue;
		roles?: JsonValue;
		expirationDateTime?: JsonValue;
		hasPassword?: JsonValue;
		webUrl?: JsonValue;
		type?: JsonValue;
		scope?: JsonValue;
		preventsDownload?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftOneDriveUploadFile: { success?: boolean } & {
		id?: JsonValue;
		name?: JsonValue;
		driveId?: string;
		isFolder?: boolean;
		size?: JsonValue;
		mimeType?: null | string;
		childCount?: JsonValue;
		webUrl?: JsonValue;
		path?: null | string | null | string;
		parentId?: string;
		createdDateTime?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		createdBy?: null | string;
		lastModifiedBy?: null | string;
		isShared?: boolean;
		sharedBy?: null | string;
		sharedByEmail?: null | string;
		sharedOwner?: null | string;
		sharedOwnerEmail?: null | string;
		sharedScope?: JsonValue;
		sharedDateTime?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookCreateMailFolderReactor.java#executeAuthenticated */
	MicrosoftOutlookCreateMailFolder: {
		id?: JsonValue;
		name?: JsonValue;
		created?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookDeleteMailReactor.java#execute */
	MicrosoftOutlookDeleteMail: { deleted?: boolean; id?: string };
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookDownloadAttachmentReactor.java#execute */
	MicrosoftOutlookDownloadAttachment: {
		id?: string;
		attachmentId?: string;
		name?: string;
		filePath?: null | string | null | string;
		size?: JsonValue;
		success?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookForwardMailReactor.java#execute */
	MicrosoftOutlookForwardMail: { forwarded?: string } & ({
		draft?: boolean;
		sent?: boolean;
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	});
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookGetMailReactor.java#execute */
	MicrosoftOutlookGetMail: MailMessageOutput;
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookListMailReactor.java#execute */
	MicrosoftOutlookListMail: {
		folder?: string;
		conversationId?: string;
		offset: number;
		count: number;
		hasMore: boolean;
		messages: MailMessageOutput[];
	};
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookListMailFoldersReactor.java#execute */
	MicrosoftOutlookListMailFolders: {
		offset?: number;
		count?: number;
		hasMore?: boolean;
		folders?: {
			id?: string;
			name?: string;
			kind?: string;
			totalCount?: number;
			unreadCount?: number;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookMarkMailReadReactor.java#execute */
	MicrosoftOutlookMarkMailRead: {
		id?: string;
		read?: boolean | null | boolean;
		unread?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/mail/AbstractMoveMailReactor.java#executeAuthenticated */
	MicrosoftOutlookMoveMail: {
		moved?: boolean;
		previousId?: string;
		id?: string | null | string;
		folder?: string;
	};
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookReplyMailReactor.java#execute */
	MicrosoftOutlookReplyMail: {
		repliedTo?: string;
		replyAll?: boolean | null | boolean;
	} & ({ draft?: boolean; sent?: boolean } & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	});
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookSaveDraftReactor.java#execute */
	MicrosoftOutlookSaveDraft: { draft?: boolean } & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookSendDraftReactor.java#execute */
	MicrosoftOutlookSendDraft: { draftId?: string } & ({
		draft?: boolean;
		sent?: boolean;
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	} & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	});
	/** @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookSendMailReactor.java#execute */
	MicrosoftOutlookSendMail: { sent?: boolean } & {
		id?: string;
		conversationId?: string;
		webLink?: string;
		to?: (string | null)[];
		cc?: (string | null)[];
		bcc?: (string | null)[];
		subject?: string;
		body?: string;
		html?: boolean;
		attachments?: (string | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsCreateChat: {
		id?: JsonValue;
		chatType?: JsonValue;
		topic?: JsonValue;
		createdDateTime?: JsonValue;
		lastUpdatedDateTime?: JsonValue;
		webUrl?: JsonValue;
		lastMessageReadDateTime?: string;
		isHidden?: boolean;
		lastMessage?: {
			id?: JsonValue;
			replyToId?: JsonValue;
			messageType?: JsonValue;
			subject?: JsonValue;
			importance?: JsonValue;
			createdDateTime?: JsonValue;
			lastModifiedDateTime?: JsonValue;
			lastEditedDateTime?: JsonValue;
			deletedDateTime?: JsonValue;
			isDeleted?: boolean;
			fromName?: null | string;
			fromId?: null | string;
			fromType?: null | string;
			webUrl?: JsonValue;
			teamId?: JsonValue;
			channelId?: JsonValue;
			bodyTruncated?: boolean;
			body?: string;
			attachments?: {
				id?: JsonValue;
				name?: JsonValue;
				contentType?: JsonValue;
				contentUrl?: JsonValue;
				isFile?: boolean;
			}[];
			mentions?: {
				id?: JsonValue;
				text?: JsonValue;
				userId?: null | string;
				name?: null | string;
			}[];
			reactions?: {
				type?: JsonValue;
				createdDateTime?: JsonValue;
				name?: null | string;
			}[];
			hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
			replyCount?: number;
			replies?: (Record<string, JsonValue> | null)[];
		};
		hasUnread?: boolean;
		members?: {
			userId?: JsonValue;
			name?: JsonValue;
			email?: JsonValue;
			roles?: JsonValue;
		}[];
		memberCount?: number;
		displayName?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsDeleteChannelMessage: {
		teamId?: string;
		channelId?: string;
		messageId?: string;
		replyId?: string;
		deleted?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsDeleteChatMessage: {
		chatId?: string;
		messageId?: string;
		deleted?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsDownloadFile: {
		id?: string;
		name?: JsonValue;
		filePath?: string;
		success?: boolean;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsDownloadMessageAttachment:
		| ({ attachmentId?: JsonValue } & {
				id?: string;
				name?: string;
				driveId?: string;
				filePath?: string;
				size?: JsonValue;
				success?: boolean;
		  })
		| {
				attachmentId?: string | null | string;
				name?: string;
				filePath?: string;
				size?: JsonValue;
				success?: boolean;
		  };
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsGetChannelMessage: {
		id?: JsonValue;
		replyToId?: JsonValue;
		messageType?: JsonValue;
		subject?: JsonValue;
		importance?: JsonValue;
		createdDateTime?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		lastEditedDateTime?: JsonValue;
		deletedDateTime?: JsonValue;
		isDeleted?: boolean;
		fromName?: null | string;
		fromId?: null | string;
		fromType?: null | string;
		webUrl?: JsonValue;
		teamId?: JsonValue;
		channelId?: JsonValue;
		bodyTruncated?: boolean;
		body?: string;
		attachments?: {
			id?: JsonValue;
			name?: JsonValue;
			contentType?: JsonValue;
			contentUrl?: JsonValue;
			isFile?: boolean;
		}[];
		mentions?: {
			id?: JsonValue;
			text?: JsonValue;
			userId?: null | string;
			name?: null | string;
		}[];
		reactions?: {
			type?: JsonValue;
			createdDateTime?: JsonValue;
			name?: null | string;
		}[];
		hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
		replyCount?: number;
		replies?: (Record<string, JsonValue> | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsGetChat: {
		id?: JsonValue;
		chatType?: JsonValue;
		topic?: JsonValue;
		createdDateTime?: JsonValue;
		lastUpdatedDateTime?: JsonValue;
		webUrl?: JsonValue;
		lastMessageReadDateTime?: string;
		isHidden?: boolean;
		lastMessage?: {
			id?: JsonValue;
			replyToId?: JsonValue;
			messageType?: JsonValue;
			subject?: JsonValue;
			importance?: JsonValue;
			createdDateTime?: JsonValue;
			lastModifiedDateTime?: JsonValue;
			lastEditedDateTime?: JsonValue;
			deletedDateTime?: JsonValue;
			isDeleted?: boolean;
			fromName?: null | string;
			fromId?: null | string;
			fromType?: null | string;
			webUrl?: JsonValue;
			teamId?: JsonValue;
			channelId?: JsonValue;
			bodyTruncated?: boolean;
			body?: string;
			attachments?: {
				id?: JsonValue;
				name?: JsonValue;
				contentType?: JsonValue;
				contentUrl?: JsonValue;
				isFile?: boolean;
			}[];
			mentions?: {
				id?: JsonValue;
				text?: JsonValue;
				userId?: null | string;
				name?: null | string;
			}[];
			reactions?: {
				type?: JsonValue;
				createdDateTime?: JsonValue;
				name?: null | string;
			}[];
			hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
			replyCount?: number;
			replies?: (Record<string, JsonValue> | null)[];
		};
		hasUnread?: boolean;
		members?: {
			userId?: JsonValue;
			name?: JsonValue;
			email?: JsonValue;
			roles?: JsonValue;
		}[];
		memberCount?: number;
		displayName?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsGetChatMessage: {
		id?: JsonValue;
		replyToId?: JsonValue;
		messageType?: JsonValue;
		subject?: JsonValue;
		importance?: JsonValue;
		createdDateTime?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		lastEditedDateTime?: JsonValue;
		deletedDateTime?: JsonValue;
		isDeleted?: boolean;
		fromName?: null | string;
		fromId?: null | string;
		fromType?: null | string;
		webUrl?: JsonValue;
		teamId?: JsonValue;
		channelId?: JsonValue;
		bodyTruncated?: boolean;
		body?: string;
		attachments?: {
			id?: JsonValue;
			name?: JsonValue;
			contentType?: JsonValue;
			contentUrl?: JsonValue;
			isFile?: boolean;
		}[];
		mentions?: {
			id?: JsonValue;
			text?: JsonValue;
			userId?: null | string;
			name?: null | string;
		}[];
		reactions?: {
			type?: JsonValue;
			createdDateTime?: JsonValue;
			name?: null | string;
		}[];
		hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
		replyCount?: number;
		replies?: (Record<string, JsonValue> | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsListChannelMessages: {
		teamId?: string;
		channelId?: string;
		count?: number;
		messages?: {
			id?: JsonValue;
			replyToId?: JsonValue;
			messageType?: JsonValue;
			subject?: JsonValue;
			importance?: JsonValue;
			createdDateTime?: JsonValue;
			lastModifiedDateTime?: JsonValue;
			lastEditedDateTime?: JsonValue;
			deletedDateTime?: JsonValue;
			isDeleted?: boolean;
			fromName?: null | string;
			fromId?: null | string;
			fromType?: null | string;
			webUrl?: JsonValue;
			teamId?: JsonValue;
			channelId?: JsonValue;
			bodyTruncated?: boolean;
			body?: string;
			attachments?: {
				id?: JsonValue;
				name?: JsonValue;
				contentType?: JsonValue;
				contentUrl?: JsonValue;
				isFile?: boolean;
			}[];
			mentions?: {
				id?: JsonValue;
				text?: JsonValue;
				userId?: null | string;
				name?: null | string;
			}[];
			reactions?: {
				type?: JsonValue;
				createdDateTime?: JsonValue;
				name?: null | string;
			}[];
			hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
			replyCount?: number;
			replies?: (Record<string, JsonValue> | null)[];
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsListChannels: {
		id?: JsonValue;
		displayName?: JsonValue;
		description?: JsonValue;
		membershipType?: JsonValue;
		webUrl?: JsonValue;
	}[];
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsListChatMessages: {
		chatId?: string;
		count?: number;
		messages?: ({
			displayBody?: {
				contentType?: string;
				content?: string;
				isTruncated?: boolean;
				attachments?: { name: string | null | string }[];
			};
		} & {
			id?: JsonValue;
			replyToId?: JsonValue;
			messageType?: JsonValue;
			subject?: JsonValue;
			importance?: JsonValue;
			createdDateTime?: JsonValue;
			lastModifiedDateTime?: JsonValue;
			lastEditedDateTime?: JsonValue;
			deletedDateTime?: JsonValue;
			isDeleted?: boolean;
			fromName?: null | string;
			fromId?: null | string;
			fromType?: null | string;
			webUrl?: JsonValue;
			teamId?: JsonValue;
			channelId?: JsonValue;
			bodyTruncated?: boolean;
			body?: string;
			attachments?: {
				id?: JsonValue;
				name?: JsonValue;
				contentType?: JsonValue;
				contentUrl?: JsonValue;
				isFile?: boolean;
			}[];
			mentions?: {
				id?: JsonValue;
				text?: JsonValue;
				userId?: null | string;
				name?: null | string;
			}[];
			reactions?: {
				type?: JsonValue;
				createdDateTime?: JsonValue;
				name?: null | string;
			}[];
			hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
			replyCount?: number;
			replies?: (Record<string, JsonValue> | null)[];
		})[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsListChats: {
		count?: number;
		unreadCount?: JsonValue;
		chats?: {
			id?: JsonValue;
			chatType?: JsonValue;
			topic?: JsonValue;
			createdDateTime?: JsonValue;
			lastUpdatedDateTime?: JsonValue;
			webUrl?: JsonValue;
			lastMessageReadDateTime?: string;
			isHidden?: boolean;
			lastMessage?: {
				id?: JsonValue;
				replyToId?: JsonValue;
				messageType?: JsonValue;
				subject?: JsonValue;
				importance?: JsonValue;
				createdDateTime?: JsonValue;
				lastModifiedDateTime?: JsonValue;
				lastEditedDateTime?: JsonValue;
				deletedDateTime?: JsonValue;
				isDeleted?: boolean;
				fromName?: null | string;
				fromId?: null | string;
				fromType?: null | string;
				webUrl?: JsonValue;
				teamId?: JsonValue;
				channelId?: JsonValue;
				bodyTruncated?: boolean;
				body?: string;
				attachments?: {
					id?: JsonValue;
					name?: JsonValue;
					contentType?: JsonValue;
					contentUrl?: JsonValue;
					isFile?: boolean;
				}[];
				mentions?: {
					id?: JsonValue;
					text?: JsonValue;
					userId?: null | string;
					name?: null | string;
				}[];
				reactions?: {
					type?: JsonValue;
					createdDateTime?: JsonValue;
					name?: null | string;
				}[];
				hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
				replyCount?: number;
				replies?: (Record<string, JsonValue> | null)[];
			};
			hasUnread?: boolean;
			members?: {
				userId?: JsonValue;
				name?: JsonValue;
				email?: JsonValue;
				roles?: JsonValue;
			}[];
			memberCount?: number;
			displayName?: JsonValue;
		}[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsListFiles: {
		id?: JsonValue;
		name?: JsonValue;
		driveId?: string;
		size?: JsonValue;
		webUrl?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		isFolder?: boolean;
		childCount?: JsonValue;
		mimeType?: JsonValue;
	}[];
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsListTeams: {
		id?: JsonValue;
		displayName?: JsonValue;
		description?: JsonValue;
	}[];
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsSendChannelMessage: {
		id?: JsonValue;
		replyToId?: JsonValue;
		messageType?: JsonValue;
		subject?: JsonValue;
		importance?: JsonValue;
		createdDateTime?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		lastEditedDateTime?: JsonValue;
		deletedDateTime?: JsonValue;
		isDeleted?: boolean;
		fromName?: null | string;
		fromId?: null | string;
		fromType?: null | string;
		webUrl?: JsonValue;
		teamId?: JsonValue;
		channelId?: JsonValue;
		bodyTruncated?: boolean;
		body?: string;
		attachments?: {
			id?: JsonValue;
			name?: JsonValue;
			contentType?: JsonValue;
			contentUrl?: JsonValue;
			isFile?: boolean;
		}[];
		mentions?: {
			id?: JsonValue;
			text?: JsonValue;
			userId?: null | string;
			name?: null | string;
		}[];
		reactions?: {
			type?: JsonValue;
			createdDateTime?: JsonValue;
			name?: null | string;
		}[];
		hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
		replyCount?: number;
		replies?: (Record<string, JsonValue> | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsSendChatMessage: { chatId?: string | null | string } & {
		id?: JsonValue;
		replyToId?: JsonValue;
		messageType?: JsonValue;
		subject?: JsonValue;
		importance?: JsonValue;
		createdDateTime?: JsonValue;
		lastModifiedDateTime?: JsonValue;
		lastEditedDateTime?: JsonValue;
		deletedDateTime?: JsonValue;
		isDeleted?: boolean;
		fromName?: null | string;
		fromId?: null | string;
		fromType?: null | string;
		webUrl?: JsonValue;
		teamId?: JsonValue;
		channelId?: JsonValue;
		bodyTruncated?: boolean;
		body?: string;
		attachments?: {
			id?: JsonValue;
			name?: JsonValue;
			contentType?: JsonValue;
			contentUrl?: JsonValue;
			isFile?: boolean;
		}[];
		mentions?: {
			id?: JsonValue;
			text?: JsonValue;
			userId?: null | string;
			name?: null | string;
		}[];
		reactions?: {
			type?: JsonValue;
			createdDateTime?: JsonValue;
			name?: null | string;
		}[];
		hostedContents?: { id?: JsonValue; contentType?: JsonValue }[];
		replyCount?: number;
		replies?: (Record<string, JsonValue> | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/AbstractConnectorReactor.java#execute */
	MicrosoftTeamsUploadFile: {
		id?: JsonValue;
		name?: JsonValue;
		size?: JsonValue;
		webUrl?: JsonValue;
		success?: boolean;
	};
	/** @source Semoss/src/prerna/reactor/images/MigrateImagesToCouchReactor.java#execute */
	MigrateImagesToCouch: (string | null)[];
	/** @source Semoss/src/prerna/reactor/workflow/ModifyInsightDatasourceReactor.java#execute */
	ModifyInsightDatasource: (string | null)[] | null;
	/** @source Semoss/src/prerna/query/parsers/ModifyParamQueryReactor.java#execute */
	ModifyParamQuery: QueryStructWireOutput;
	/** @source Semoss/src/prerna/date/reactor/MonthReactor.java#execute */
	Month: { numMonths: number };
	/** @source Semoss/src/prerna/reactor/panel/MovePanelReactor.java#execute */
	MovePanel: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/MyEngineProjectReactor.java#execute */
	MyEngineProject: (EngineCatalogRow | ProjectCatalogRow)[];
	/** @source Semoss/src/prerna/reactor/insights/MyOpenInsightsReactor.java#execute */
	MyOpenInsights: (string | null)[];
	/** @source Semoss/src/prerna/reactor/algorithms/NLSQueryHelperReactor.java#execute */
	NLSQueryHelper: (string | null)[] | ((string | null)[] | null)[];
	/** @source Semoss/src/prerna/reactor/algorithms/NaturalLanguageSearchReactor.java#execute */
	NaturalLanguageSearch:
		| (Record<string, unknown> | null)[]
		| null
		| {
				database_id?: string;
				database_name?: string | null;
				frame_name?: string;
				import_pixel?: string;
				viz_types_pixel?: string;
				viz_pixel?: string;
				layout?: string;
				columns?: (string | null | string)[] | (string | null)[];
		  }[];
	/** @source Semoss/src/prerna/reactor/NegReactor.java#execute */
	Neg: number | null;
	/** @source Semoss/src/prerna/reactor/NegEvaluator.java#execute */
	NegEvaluator: number | null;
	/** @source Semoss/src/prerna/reactor/cluster/OpenDatabaseReactor.java#execute */
	OpenDatabase: {
		database_name?: string;
		database_id?: string;
		database_type: string;
		database_subtype?: string;
		database_cost: string;
	};
	/** @source Semoss/src/prerna/reactor/insights/OpenEmptyInsightReactor.java#execute */
	OpenEmptyInsight: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/insights/OpenInsightReactor.java#execute */
	OpenInsight:
		| {
				name?: string;
				app_id?: string;
				app_name?: string;
				app_insight_id?: string;
				core_engine?: string;
				core_engine_id?: string;
				layout?: string;
		  }
		| PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/playwright/OpenPlaywrightSocketsRoomRecordingReactor.java#execute */
	OpenPlaywrightSocketsRoomRecording: {
		status?: string;
		start_url?: string | null | string;
		recording_name_hint?: string;
		instructions?: string;
	};
	/** @source Semoss/src/prerna/reactor/panel/PanelReactor.java#execute */
	Panel: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/playwright/PatchFileMetaReactor.java#execute */
	PatchFileMeta: {
		id?: string;
		title?: string;
		description?: string;
		createdAt?: number;
		updatedAt?: number;
		intent?: string;
	} | null;
	/** @source Semoss/src/prerna/reactor/playwright/PatchSessionMetaReactor.java#execute */
	PatchSessionMeta: {
		id?: string;
		title?: string;
		description?: string;
		createdAt?: number;
		updatedAt?: number;
		intent?: string;
	};
	/** @source Semoss/src/prerna/reactor/export/PdfToImageReactor.java#execute */
	PdfToImage: string[];
	/** @source Semoss/src/prerna/reactor/codeexec/PixelReactor.java#execute */
	Pixel: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/codeexec/PixelBase64Reactor.java#execute */
	PixelBase64: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/PixelSourceReactor.java#execute */
	PixelSource: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/playwright/PlanNextPlaywrightActionReactor.java#execute */
	PlanNextPlaywrightAction: {
		success?: boolean;
		goal?: string;
		goalReached?: unknown;
		reason?: unknown;
		action?: unknown;
		pageUrl?: string;
		tabId?: string;
		engineId?: string;
		iteration?: number;
		maxIterations?: number;
		availableActionCount?: number;
		error?: string;
	};
	/** @source Semoss/src/prerna/reactor/playwright/PlayPlaywrightSocketsRoomRecordingReactor.java#execute */
	PlayPlaywrightSocketsRoomRecording: {
		status?: string;
		mode?: string;
		recording_name_hint?: string;
		recording_file?: string;
		project_id?: string;
		start_url?: string | null | string | null | string;
		instructions?: string;
	};
	/** @source Semoss/src/prerna/reactor/PowAssimilator.java#execute */
	PowAssimilator: string | number | null;
	/** @source Semoss/src/prerna/reactor/algorithms/CreateNLPVizReactor.java#execute */
	PredictViz: TaskCollectionOutput;
	/** @source Semoss/src/prerna/reactor/playwright/ProbeElementReactor.java#execute */
	ProbeElement: Record<string, unknown> | null;
	/** @source Semoss/src/prerna/usertracking/reactors/ProjectAuditEventsReactor.java#execute */
	ProjectAuditEvents: {
		events: ResourceAuditEvent[];
		hasNextPage: boolean;
		page: number;
		pageSize: number;
	};
	/** @source Semoss/src/prerna/reactor/codeexec/PyReactor.java#execute */
	Py: string | NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/codeexec/PyBase64Reactor.java#execute */
	PyBase64: string | NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/codeexec/PySourceReactor.java#execute */
	PySource: NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/masterdatabase/QueryTranslatorReactor.java#execute */
	QueryTranslator: string[];
	/** @source Semoss/src/prerna/reactor/codeexec/RReactor.java#execute */
	R: NestedPixelOutput[] | "no output";
	/** @source Semoss/src/prerna/reactor/codeexec/RSourceReactor.java#execute */
	RSource: NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/insights/themes/ReadInsightThemeReactor.java#execute */
	ReadInsightTheme:
		| Record<string, JsonValue>
		| Record<string, JsonValue>
		| null;
	/** @source Semoss/src/prerna/reactor/panel/RefreshPanelViewReactor.java#execute */
	RefreshPanelView: NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/insights/dashboard/ReloadInsightReactor.java#execute */
	ReloadInsight: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/insights/ReloadInsightClassesReactor.java#execute */
	ReloadInsightClasses: string;
	/** @source Semoss/src/prerna/reactor/utils/RemoteEngineRunReactor.java#execute */
	RemoteEngineRun: {
		epoc?: string;
		operation?:
			| "R"
			| "PYTHON"
			| "NODE"
			| "CHROME"
			| "ECHO"
			| "ENGINE"
			| "REACTOR"
			| "INSIGHT"
			| "PROJECT"
			| "CMD"
			| "STDOUT"
			| "STDERR"
			| "STRUCTURED_STREAM"
			| "CANCELLED"
			| "LOG";
		methodName?: string;
		payload?: unknown[];
		payloadClasses?: unknown[];
		payloadClassNames?: (string | null)[];
		engineType?: string;
		ex?: string;
		processed: boolean;
		longRunning: boolean;
		env?: string;
		interim: boolean;
		inputAlias?: (string | null)[];
		aliasReturn?: string;
		hasReturn: boolean;
		parentEpoc?: string;
		response: boolean;
		objId?: string;
		projectId?: string;
		projectName?: string;
		portalId?: string;
		insightId?: string;
		jobId?: string;
		disableCancelTrace: boolean;
		sessionId?: string;
		asset_paths?: (string | null)[];
		runtime_vars?: Record<string, unknown>;
		append_vars?: Record<string, unknown>;
		executionInsightId?: string;
		mdc?: Record<string, string | null>;
	} | null;
	/** @source Semoss/src/prerna/reactor/automation/definition/RemoveAutomationStepReactor.java#removeStep */
	RemoveAutomationStep: {
		removed?: boolean;
		nodeId?: string;
		removedNodeIds?: (string | null)[];
		revision?: string;
	};
	/** @source Semoss/src/prerna/reactor/utils/RemoveFrameReactor.java#execute */
	RemoveFrame: string | false;
	/** @source Semoss/src/prerna/reactor/scheduler/RemoveJobFromDBReactor.java#execute */
	RemoveJobFromDB: { success: string[]; failed: string[] };
	/** @source Semoss/src/prerna/reactor/panel/rules/RemovePanelColorByValueReactor.java#execute */
	RemovePanelColorByValue: { panelId?: string; name?: string };
	/** @source Semoss/src/prerna/reactor/panel/comments/RemovePanelCommentReactor.java#execute */
	RemovePanelComment: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/events/RemovePanelEventsReactor.java#execute */
	RemovePanelEvents: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/ornaments/RemovePanelOrnamentsReactor.java#execute */
	RemovePanelOrnaments: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/sort/UnsortPanelReactor.java#execute */
	RemovePanelSort: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/utils/RemoveVariableReactor.java#execute */
	RemoveVariable: boolean;
	/** @source Semoss/src/prerna/reactor/panel/filter/ReplacePanelFilterReactor.java#execute */
	ReplacePanelFilter: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/ReplayRecipeReactor.java#execute */
	ReplayRecipe: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/playwright/ReplaySingleStepReactor.java#execute */
	ReplaySingleStep: {
		status?: string;
		error?: unknown;
		screenshot?: {
			base64Png?: string;
			width: number;
			height: number;
			deviceScaleFactor: number;
		};
		stepId?: number;
		tabId?: string;
		shouldStop?: boolean;
		isNewTab?: boolean;
		newTabId?: string;
		tabTitle?: string;
	};
	/** @source Semoss/src/prerna/reactor/playwright/ReplayStepReactor.java#execute */
	ReplayStep: {
		screenshot?: {
			base64Png?: string;
			width: number;
			height: number;
			deviceScaleFactor: number;
		};
	};
	/** @source Semoss/src/prerna/reactor/panel/events/ResetPanelEventsReactor.java#execute */
	ResetPanelEvents: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/ornaments/ResetPanelOrnamentsReactor.java#execute */
	ResetPanelOrnaments: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/automation/agent/ResolveAutomationAgentRunActionReactor.java#execute */
	ResolveAutomationAgentRunAction: {
		result?:
			| string
			| null
			| string
			| null
			| string
			| null
			| string
			| null
			| string;
	};
	/** @source Semoss/src/prerna/reactor/playwright/ResolvePlaywrightRoomRecordingReactor.java#execute */
	ResolvePlaywrightRoomRecording: {
		selected?: null | Record<string, unknown>;
		candidates?: unknown[];
		searchedProjectRecordings?: unknown;
		searchedRoomRecordings?: unknown;
	};
	/** @source Semoss/src/prerna/reactor/automation/run/ResumeAutomationRunReactor.java#execute */
	ResumeAutomationRun: AutomationRunOutput;
	/** @source Semoss/src/prerna/reactor/scheduler/ResumeJobTriggerReactor.java#execute */
	ResumeJobTrigger: { jobId?: string; jobGroup?: string };
	/** @source Semoss/src/prerna/reactor/insights/RetrieveInsightOrnamentReactor.java#execute */
	RetrieveInsightOrnament: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/RetrieveInsightPipelineReactor.java#execute */
	RetrieveInsightPipeline:
		| Record<string, JsonValue>
		| Record<string, JsonValue>
		| null;
	/** @source Semoss/src/prerna/reactor/panel/rules/RetrievePanelColorByValueReactor.java#execute */
	RetrievePanelColorByValue: QueryStructWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/comments/RetrievePanelCommentReactor.java#execute */
	RetrievePanelComment: {
		panelId: string;
		commentData: JsonObject | Record<string, JsonObject>;
	};
	/** @source Semoss/src/prerna/reactor/panel/events/RetrievePanelEventsReactor.java#execute */
	RetrievePanelEvents: { panelId: string; events: JsonValue; path?: string };
	/** @source Semoss/src/prerna/reactor/panel/ornaments/RetrievePanelOrnamentsReactor.java#execute */
	RetrievePanelOrnaments: {
		panelId: string;
		ornaments: JsonValue;
		path?: string;
	};
	/** @source Semoss/src/prerna/reactor/tax/RetrieveValue.java#execute */
	RetrieveValue: unknown;
	/** @source Semoss/src/prerna/reactor/agent/RunAgentReactor.java#execute */
	RunAgent:
		| { runId: string; roomId: string; status: string }
		| (AgentRunOutput & { waitTimedOut: boolean });
	/** @source Semoss/src/prerna/reactor/test/RunAliasMatchReactor.java#execute */
	RunAliasMatch: "no output";
	/** @source Semoss/src/prerna/reactor/automation/run/RunAutomationDefinitionReactor.java#execute */
	RunAutomationDefinition: AutomationRunOutput;
	/** @source Semoss/src/prerna/reactor/algorithms/RunGPT2DescriptionReactor.java#execute */
	RunGPT2Description: (string | null)[] | null;
	/** @source Semoss/src/prerna/reactor/algorithms/RunImpliedInsightsReactor.java#execute */
	RunImpliedInsights: NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/algorithms/RunKeyAttributesReactor.java#execute */
	RunKeyAttributes: {
		headers?: (string | null)[];
		values?: (unknown[] | null)[];
	};
	/** @source Semoss/src/prerna/reactor/agent/mcp/RunMCPToolReactor.java#execute */
	RunMCPTool: JsonValue;
	/** @source Semoss/src/prerna/reactor/algorithms/RunMatrixRegressionReactor.java#execute */
	RunMatrixRegression:
		| {
				data?: unknown[];
				headers?: unknown[];
				layout?: string;
				panelId?: string;
				dataTableAlign?: { "dim 0"?: unknown } & unknown;
				specificData?: {
					"one-row"?: boolean;
					coefficients?: (number | null)[];
					r2?: unknown;
					sumOfResidual?: number;
					shift?: unknown;
					correlations?: unknown;
				};
		  }
		| NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/algorithms/RunNumericalCorrelationReactor.java#execute */
	RunNumericalCorrelation: TaskCollectionOutput<ConstantTableTaskData>;
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/RunParameterRecipeReactor.java#execute */
	RunParameterRecipe: PixelRunnerWireOutput;
	/** @source Semoss/src/prerna/reactor/planner/graph/RunPlanReactor.java#execute */
	RunPlan: {
		g?: unknown;
		roots?: unknown[];
		varStore?: Record<string, SerializedNounMetadata>;
	} | null;
	/** @source Semoss/src/prerna/reactor/legacy/playsheets/RunPlaysheetReactor.java#execute */
	RunPlaysheet: {
		isPkqlRunnable?: boolean;
		recipe?: unknown[];
		pkqlOutput?: {
			insights?: {
				clear?: boolean;
				closedPanels?: unknown[];
				dataID?: number;
				feData?: Record<string, unknown>;
				insightID?: string;
				newColumns?: Record<string, unknown>;
				newInsights?: unknown[];
				pkqlData?: unknown[];
			}[];
		};
	} & ({
		insightID?: string;
		layout?: string;
		title?: string;
		dataMakerName?: string;
		dataTableAlign?: Record<string, string | null>;
		uiOptions?: string;
	} & {
		nodes?: Record<
			string,
			{ uri?: string; propHash?: Record<string, unknown> } | null
		>;
		edges?: ({
			uri?: string;
			source?: string;
			target?: string;
			propHash?: Record<string, unknown>;
		} | null)[];
	} & unknown &
		unknown);
	/** @source Semoss/src/prerna/reactor/legacy/playsheets/RunPlaysheetMethodReactor.java#execute */
	RunPlaysheetMethod: unknown;
	/** @source Semoss/src/prerna/reactor/test/RuntimeClassTest.java#execute */
	RuntimeClassTest: "no output";
	/** @source Semoss/src/prerna/reactor/test/RuntimeClassTestSingle.java#execute */
	RuntimeClassTestSingle: "no output";
	/** @source Semoss/src/prerna/query/querystruct/SQLGetParamsReactor.java#execute */
	SQLGetParams: string[] | "no output";
	/** @source Semoss/src/prerna/io/connector/salesforce/SalesforceCreateRecordReactor.java#execute */
	SalesforceCreateRecord: {
		id?: string;
		success?: boolean;
		errors?: JsonValue;
	};
	/** @source Semoss/src/prerna/io/connector/salesforce/SalesforceDeleteRecordReactor.java#execute */
	SalesforceDeleteRecord: { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/salesforce/SalesforceObjectSchemaReactor.java#execute */
	SalesforceObjectSchema: {
		objects?: (string | null)[];
		fields?: (string | null)[];
	};
	/** @source Semoss/src/prerna/io/connector/salesforce/SalesforceRecordByIdReactor.java#execute */
	SalesforceRecordById: { fields?: Record<string, JsonValue> };
	/** @source Semoss/src/prerna/io/connector/salesforce/SalesforceSoqlQueryReactor.java#execute */
	SalesforceSoqlQuery: { totalSize?: JsonValue; records?: JsonValue };
	/** @source Semoss/src/prerna/io/connector/salesforce/SalesforceSoslSearchReactor.java#execute */
	SalesforceSoslSearch: { searchRecords?: JsonValue };
	/** @source Semoss/src/prerna/io/connector/salesforce/SalesforceUpdateRecordReactor.java#execute */
	SalesforceUpdateRecord: { success?: boolean };
	/** @source Semoss/src/prerna/reactor/automation/definition/SaveAutomationReactor.java#execute */
	SaveAutomation: {
		saved?: boolean;
		nodeSources?: Record<string, string | null>;
		revision?: string;
		globals?: Record<string, JsonValue> | null | Record<string, never>;
		scopeVariables?: Record<
			string,
			(Record<string, JsonValue> | null)[] | null
		>;
	};
	/** @source Semoss/src/prerna/reactor/insights/save/SaveInsightReactor.java#execute */
	SaveInsight: {
		app_insight_id?: string;
		app_name?: string;
		app_id?: string;
		name?: string | null | string;
		project_insight_id?: string;
		project_name?: string;
		project_id?: string;
		recipe?: (string | null)[];
		cacheable?: boolean | null | boolean;
		cacheMinutes?: number | null | number;
		cacheCron?: string | null | string | null | string | null | string;
		cacheEncrypt?: boolean | null | boolean;
		isPublic?: boolean;
	};
	/** @source Semoss/src/prerna/reactor/tax/SaveTaxScenarioReactor.java#execute */
	SaveTaxScenario: "no output";
	/** @source Semoss/src/prerna/reactor/scheduler/ScheduleJobReactor.java#execute */
	ScheduleJob: {
		"-jobId"?: string;
		"-jobName"?: string;
		"-jobGroup"?: string;
		"-jobCronExpression"?: string;
		"-jobCronTimeZone"?: string;
		"-jobTriggerOnLoad"?: boolean;
		uiState?: string;
		"-jobClass"?: string;
		pixel?: string;
		pixelParameters?: string;
	};
	/** @source Semoss/src/prerna/reactor/scheduler/SchedulerHistoryReactor.java#execute */
	SchedulerHistory: TaskCollectionOutput<TableTaskData>;
	/** @source Semoss/src/prerna/reactor/scheduler/SchedulerStatsReactor.java#execute */
	SchedulerStats: {
		totalRuns: number;
		failures: number;
		successRate: number;
		avgDurationMs: number;
		p95DurationMs: number;
		activeJobs: number;
		pausedJobs: number;
		overdueJobs: number;
		nextRunAt?: string;
		worstJob?: {
			jobId: string;
			name?: string;
			consecutiveFailures: number;
		};
	};
	/** @source Semoss/src/prerna/reactor/playwright/ScreenshotReactor.java#execute */
	Screenshot: {
		base64Png?: string;
		width: number;
		height: number;
		deviceScaleFactor: number;
	};
	/** @source Semoss/src/prerna/util/git/reactors/SearchAssetReactor.java#execute */
	SearchAsset: ResourceOutputTypes["BrowseAppAssets"];
	/** @source Semoss/src/prerna/reactor/insights/fs/SearchInsightAssetsReactor.java#execute */
	SearchInsightAssets: ResourceOutputTypes["BrowseAppAssets"];
	/** @source Semoss/src/prerna/reactor/user/fs/SearchUserAssetsReactor.java#execute */
	SearchUserAssets: ResourceOutputTypes["BrowseAppAssets"];
	/** @source Semoss/src/prerna/reactor/SendErrorMessageReactor.java#execute */
	SendErrorMessage: string | null;
	/** @source Semoss/src/prerna/io/connector/servicenow/ServiceNowCreateRecordReactor.java#execute */
	ServiceNowCreateRecord: { success?: boolean; recordUrl?: string };
	/** @source Semoss/src/prerna/io/connector/servicenow/ServiceNowDeleteRecordReactor.java#execute */
	ServiceNowDeleteRecord: { success?: boolean };
	/** @source Semoss/src/prerna/io/connector/servicenow/ServiceNowListTablesReactor.java#execute */
	ServiceNowListTables: { tables?: (string | null)[] };
	/** @source Semoss/src/prerna/io/connector/servicenow/ServiceNowRetrieveRecordsReactor.java#execute */
	ServiceNowRetrieveRecords:
		| (Record<string, JsonValue> | null)[]
		| null
		| JsonValue[];
	/** @source Semoss/src/prerna/io/connector/servicenow/ServiceNowRetrieveSingleRecordReactor.java#execute */
	ServiceNowRetrieveSingleRecord: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/io/connector/servicenow/ServiceNowTableMetadataReactor.java#execute */
	ServiceNowTableMetadata: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/io/connector/servicenow/ServiceNowUpdateRecordReactor.java#execute */
	ServiceNowUpdateRecord: { success?: boolean };
	/** @source Semoss/src/prerna/reactor/insights/SetAppConfigReactor.java#execute */
	SetAppConfig: unknown;
	/** @source Semoss/src/prerna/reactor/SetFilterRefresh.java#execute */
	SetFilterRefresh: boolean;
	/** @source Semoss/src/prerna/reactor/insights/save/SetInsightCacheableReactor.java#execute */
	SetInsightCacheable: {
		app_insight_id?: string;
		app_name?: string;
		app_id?: string;
		project_insight_id?: string;
		project_name?: string;
		project_id?: string;
		cacheable?: boolean;
		cacheMinutes?: number;
		cacheEncrypt?: boolean;
		cacheCron?: string | null | string | null | string;
	};
	/** @source Semoss/src/prerna/reactor/insights/SetInsightConfigReactor.java#execute */
	SetInsightConfig: unknown;
	/** @source Semoss/src/prerna/reactor/insights/SetInsightGoldenLayoutReactor.java#execute */
	SetInsightGoldenLayout: unknown;
	/** @source Semoss/src/prerna/reactor/insights/SetInsightGraphOptionsReactor.java#execute */
	SetInsightGraphOptions:
		| Record<string, JsonValue>
		| null
		| Record<string, never>;
	/** @source Semoss/src/prerna/reactor/insights/save/SetInsightNameReactor.java#execute */
	SetInsightName: {
		app_insight_id?: string;
		app_name?: string;
		app_id?: string;
		name?: string | null | string;
		project_insight_id?: string;
		project_name?: string;
		project_id?: string;
	};
	/** @source Semoss/src/prerna/reactor/insights/SetInsightOrnamentReactor.java#execute */
	SetInsightOrnament: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/insights/themes/SetInsightThemeReactor.java#execute */
	SetInsightTheme: Record<string, JsonValue> | null;
	/** @source Semoss/src/prerna/reactor/panel/sort/SetMultiTypePanelSortReactor.java#execute */
	SetMultiTypePanelSort: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/SetOpenInsightParamValueReactor.java#execute */
	SetOpenInsightParamValue: JsonObject | null;
	/** @source Semoss/src/prerna/reactor/panel/SetPanelCollectReactor.java#execute */
	SetPanelCollect: { panelId?: string; numCollect?: number };
	/** @source Semoss/src/prerna/reactor/panel/filter/SetPanelFilterReactor.java#execute */
	SetPanelFilter: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/panel/SetPanelLabelReactor.java#execute */
	SetPanelLabel: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/SetPanelPositionReactor.java#execute */
	SetPanelPosition: { panelId: string; positionMap: JsonObject };
	/** @source Semoss/src/prerna/reactor/panel/SetPanelSheetReactor.java#execute */
	SetPanelSheet: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/sort/SetPanelSortReactor.java#execute */
	SetPanelSort: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/panel/sort/SetPanelSortByReactor.java#execute */
	SetPanelSortBy: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/panel/SetPanelStateReactor.java#execute */
	SetPanelState: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/panel/SetPanelViewReactor.java#execute */
	SetPanelView: {
		panelId?: string;
		view?: string;
		options?: string;
		renderedOptions?: string | null | string;
	};
	/** @source Semoss/src/prerna/query/querystruct/SetParamsReactor.java#execute */
	SetParams: string;
	/** @source Semoss/src/prerna/reactor/agent/mcp/SetRemoteMCPReactor.java#execute */
	SetRemoteMCP: {
		project_id?: string | null | string;
		project_remote_mcp?: boolean;
		project_remote_mcp_endpoint?: string;
		project_remote_mcp_auth_scheme?: string;
		project_remote_mcp_auth_token?: string | null | string;
	};
	/** @source Semoss/src/prerna/reactor/sheet/SetSheetBackgroundReactor.java#execute */
	SetSheetBackground: SheetWireOutput | null;
	/** @source Semoss/src/prerna/reactor/sheet/SetSheetConfigReactor.java#execute */
	SetSheetConfig: SheetWireOutput | null;
	/** @source Semoss/src/prerna/reactor/sheet/SetSheetLabelReactor.java#execute */
	SetSheetLabel: SheetWireOutput | null;
	/** @source Semoss/src/prerna/reactor/sheet/SetSheetStateReactor.java#execute */
	SetSheetState: SheetWireOutput | null;
	/** @source Semoss/src/prerna/reactor/sheet/SheetReactor.java#execute */
	Sheet: SheetWireOutput | null;
	/** @source Semoss/src/prerna/reactor/playwright/SkipStepReactor.java#execute */
	SkipStep: Record<string, unknown> | null;
	/** @source Semoss/src/prerna/reactor/export/snowflake/SnowflakeListFilesReactor.java#execute */
	SnowflakeListFiles: (Record<string, unknown> | null)[];
	/** @source Semoss/src/prerna/reactor/export/snowflake/SnowflakePutReactor.java#execute */
	SnowflakePut: (Record<string, unknown> | null)[];
	/** @source Semoss/src/prerna/reactor/export/snowflake/SnowflakeRemoveFilesReactor.java#execute */
	SnowflakeRemoveFiles: (Record<string, unknown> | null)[];
	/** @source Semoss/src/prerna/reactor/agent/subagent/SpawnSubAgentReactor.java#execute */
	SpawnSubAgent: string;
	/** @source Semoss/src/prerna/reactor/playwright/StepReactor.java#execute */
	Step: {
		screenshot?: {
			base64Png?: string;
			width: number;
			height: number;
			deviceScaleFactor: number;
		};
	};
	/** @source Semoss/src/prerna/reactor/agent/StopAgentRunReactor.java#execute */
	StopAgentRun: AgentRunOutput;
	/** @source Semoss/src/prerna/reactor/automation/agent/StopAutomationAgentRunReactor.java#execute */
	StopAutomationAgentRun: AgentRunOutput & { canControl: boolean };
	/** @source Semoss/src/prerna/reactor/insights/StoreInsightRecipeStepMetadataReactor.java#execute */
	StoreInsightRecipeStepMetadata:
		| string
		| null
		| { pixelId?: string; alias?: string; description?: string };
	/** @source Semoss/src/prerna/reactor/tax/StoreValue.java#execute */
	StoreValue: "no output";
	/** @source Semoss/src/prerna/io/connector/surveymonkey/SurveyMonkeyListSurveysReactor.java#execute */
	SurveyMonkeyListSurveys: { name?: string; id?: string }[];
	/** @source Semoss/src/prerna/reactor/tax/TaxRetrieveValue2.java#execute */
	TaxRetrieveValue2: Record<string, SerializedNounMetadata>;
	/** @source Semoss/src/prerna/date/reactor/TimestampReactor.java#execute */
	Timestamp: string;
	/** @source Semoss/src/prerna/reactor/automation/run/TriggerAutomationReactor.java#execute */
	TriggerAutomation: AutomationRunOutput;
	/** @source Semoss/src/prerna/sablecc2/pipeline/UndeterminedPipelineReactor.java#execute */
	UndeterminedPipeline: never;
	/** @source Semoss/src/prerna/reactor/panel/filter/UnfilterPanelReactor.java#execute */
	UnfilterPanel: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/reactor/panel/sort/UnsortPanelReactor.java#execute */
	UnsortPanel: {
		type?: "FRAME" | "PANEL";
		name?: string;
		filterVal: boolean;
	};
	/** @source Semoss/src/prerna/query/querystruct/update/reactors/UpdateReactor.java#execute */
	Update: QueryStructWireOutput;
	/** @source Semoss/src/prerna/reactor/automation/definition/UpdateAutomationCustomStepReactor.java#updateSource */
	UpdateAutomationCustomStep: {
		nodeId?: string;
		sourceHash?: string;
		revision?: string;
	};
	/** @source Semoss/src/prerna/reactor/automation/definition/UpdateAutomationStepReactor.java#updateStep */
	UpdateAutomationStep: {
		node?: {
			config?: Record<string, JsonValue>;
			codeMode?: string;
			label?: string;
		};
		source?: string;
		revision?: string;
	};
	/** @source Semoss/src/prerna/reactor/planner/graph/UpdateGraphPlannerReactor2.java#execute */
	UpdateGraphPlannerReactor2: {
		g?: unknown;
		roots?: unknown[];
		varStore?: Record<string, SerializedNounMetadata>;
	};
	/** @source Semoss/src/prerna/reactor/insights/save/UpdateInsightReactor.java#execute */
	UpdateInsight: {
		app_insight_id?: string;
		app_name?: string;
		app_id?: string;
		name?: string | null | string;
		project_insight_id?: string;
		project_name?: string;
		project_id?: string;
		recipe?: (string | null)[];
		cacheable?: boolean | null | boolean;
		cacheMinutes?: number | null | number;
		cacheCron?: string | null | string | null | string;
		cacheEncrypt?: boolean | null | boolean;
		isPublic?: boolean;
	};
	/** @source Semoss/src/prerna/reactor/insights/recipemanagement/UpdateInsightParameterReactor.java#execute */
	UpdateInsightParameter: InsightParameterOutput;
	/** @source Semoss/src/prerna/reactor/panel/comments/UpdatePanelCommentReactor.java#execute */
	UpdatePanelComment: PanelWireOutput;
	/** @source Semoss/src/prerna/reactor/agent/skill/UpdateSkillReactor.java#execute */
	UpdateSkill: {
		skill_id?: string;
		name?: string;
		description?: string;
		content_updated?: boolean;
	};
	/** @source Semoss/src/prerna/reactor/playwright/UpdateStepReactor.java#execute */
	UpdateStep: {
		screenshot?: ScreenshotWireOutput;
		updatedSteps: PlaywrightStepOutput[];
	};
	/** @source Semoss/src/prerna/reactor/app/UploadAppReactor.java#execute */
	UploadApp: ResourceOutputTypes["UploadProjectApp"];
	/** @source Semoss/src/prerna/reactor/insights/UploadInsightReactor.java#execute */
	UploadInsight: {
		name?: string;
		app_insight_id?: string;
		app_name?: string;
		app_id?: string;
		recipe?: (string | null)[];
	};
	/** @source Semoss/src/prerna/usertracking/reactors/UserActivityReactor.java#execute */
	UserActivity: QueryStructWireOutput;
	/** @source Semoss/src/prerna/usertracking/reactors/UserActivitySQLiteReactor.java#execute */
	UserActivitySQLite: QueryStructWireOutput;
	/** @source Semoss/src/prerna/reactor/VectorReactor.java#execute */
	Vector: NestedPixelOutput[];
	/** @source Semoss/src/prerna/reactor/cluster/VersionReactor.java#execute */
	Version: Record<string, string | null> | null;
	/** @source Semoss/src/prerna/util/usertracking/reactors/recommendations/VizRecommendationsReactor.java#execute */
	VizRecommendations: Record<string, Record<string, string>>;
	/** @source Semoss/src/prerna/date/reactor/WeekReactor.java#execute */
	WEEK: { numWeeks: number };
	/** @source Semoss/src/prerna/reactor/export/WriteObjectToFileReactor.java#execute */
	WriteObjectToFile: string;
	/** @source Semoss/src/prerna/date/reactor/YearReactor.java#execute */
	YEAR: { numYears: number };
}
