import type { getEngines as getAdminEngines } from "../../api/monolith/auth/admin/engine";
import type { getProjects as getAdminProjects } from "../../api/monolith/auth/admin/project";
import type {
	getEngines,
	getEngineUsers,
} from "../../api/monolith/auth/engine";
import type { getMyUsageLimitPath } from "../../api/monolith/auth/permission-batch";
import type { getProjects } from "../../api/monolith/auth/project";
import type { getConfig } from "../../api/monolith/config";
import type {
	QueryStructWireOutput,
	TableTaskData,
	TaskCollectionOutput,
} from "./query-output-types";
import type { VerifiedReactorCatalog } from "./verified-contracts";

/** Exact legacy query used by UploadUtilities.getProjectReturnData. */
export type UploadedProject =
	VerifiedReactorCatalog["GetProjectList"]["output"][number];

/** SecurityEngineUtils.getUserEngineList(User, String, List), not its richer list overload. */
export interface UploadedEngine {
	engine_display_name?: string;
	engine_id?: string;
	engine_name?: string;
	engine_type?: string;
	engine_subtype?: string;
	engine_tool_app?: string;
	engine_cost?: string;
	engine_discoverable?: boolean;
	engine_global?: boolean;
	engine_created_by?: string;
	engine_created_by_type?: string;
	engine_date_created?: string;
	database_id?: string;
	database_name?: string;
	database_type?: string;
	database_discoverable?: boolean;
	low_engine_name?: string;
}

/** FileSystemUtil.createMeta, shared by browse and recursive search. */
interface AssetEntry {
	name: string;
	path: string;
	lastModified: string;
	type: string;
}

interface GitFileStatus {
	path: string;
	status: string;
}

/** GitReactorResponseUtils.buildStatusMap; null map fields are omitted by Gson. */
interface GitStatus {
	branch?: string;
	detached: boolean;
	headCommitId?: string;
	lastCommit?: {
		commitId: string;
		message: string;
		author: string;
		authorEmail: string;
		date: string;
	};
	staged: GitFileStatus[];
	unstaged: GitFileStatus[];
	untracked: GitFileStatus[];
	conflicted: GitFileStatus[];
	clean: boolean;
}

interface GitBranches {
	currentBranch?: string;
	detached: boolean;
	branches: {
		name: string;
		fullName: string;
		remote: boolean;
		current: boolean;
		commitId?: string;
		upstream?: string;
		ahead?: number;
		behind?: number;
	}[];
}

interface GitCheckout {
	branch: string;
	headCommitId?: string;
	status: GitStatus;
}

interface GitDiff {
	path: string;
	side: string;
	diff: string;
	isBinary: boolean;
	isTruncated: boolean;
	base?: string;
	ours?: string;
	theirs?: string;
	result?: string;
}

interface GitResolvedConflict {
	path: string;
	resolved: boolean;
	remainingConflicts: string[];
	status: GitStatus;
}

interface EngineCommit {
	commitId: string;
	author: { userId: string; userEmail: string };
	date: string;
	commitMessage: string;
	tags: string[];
}

interface ProjectCommit extends EngineCommit {
	parentCommitIds: string[];
	refs: { name: string; type: string }[];
}

interface CommitDiff {
	fileName: string;
	changeType: string;
	oldPath?: string;
	newPath?: string;
	diff: string;
	isBinary: boolean;
	isTruncated: boolean;
}

/** StorageSyncStatus copies null file lists into empty lists before serialization. */
interface StorageSyncStatus {
	storagePath?: string;
	status: "SUCCESS" | "PARTIAL" | "FAILED";
	uploadedFiles: string[];
	skippedFiles: string[];
	failedFiles: string[];
}

/** Native storage implementations and the normalized rclone lsjson result. */
interface StorageEntry {
	Path: string;
	Name?: string;
	Size?: number;
	MimeType?: string;
	ModTime?: string;
	IsDir?: boolean;
	/** Provider/user metadata can contain arbitrary parsed JSON values. */
	Metadata?: Record<string, unknown>;
}

interface StorageVersion {
	versionId?: string;
	lastModified?: string;
	size?: number;
	isLatest?: boolean;
	key?: string;
	lastModifiedBy?: string;
}

interface FileEmbeddingStatus {
	fileName?: string;
	status?: string;
	insertedRecords: number;
	failedRecords: number;
	totalRecords: number;
	error?: { errorMessage?: string; techErrorMessage?: string };
}

type ModelResponse = VerifiedReactorCatalog["LLM"]["output"];

/** Batch response maps omit null identifiers and preserve provider-specific count keys. */
interface ModelBatchStatus {
	batchId?: string;
	status?: string;
	counts?: Record<string, unknown>;
}

interface ModelBatchSubmission {
	batchId?: string;
	status?: string;
	requestCount?: number;
}

/** GuardrailNounMetadata fixes the envelope; each guardrail supplies its own detail value. */
interface GuardrailResult {
	pass: boolean;
	returnPrompt?: string;
	fullDetails?: unknown;
}

type GuardrailWithDetails<D> = Omit<GuardrailResult, "fullDetails"> & {
	fullDetails: D;
};

interface PromptGuardrailDetails {
	/** The judge response is trimmed text; it is not restricted to SAFE/UNSAFE. */
	classification: string;
	modelEngineId: string;
	judgeErrorVerdict?: "PASS" | "BLOCK";
	error?: string;
}

type JevGuardrailDetails =
	| { outcome: "SKIPPED_NO_TEXT"; reason: string }
	| {
			outcome: "ERROR";
			outcomeType: "EVALUATION_ERROR";
			error?: string;
			judgeErrorVerdict: "PASS" | "BLOCK";
			reason: string;
			judgeModelEngineId?: string;
	  }
	| ({
			outcome: "INDETERMINATE" | "VIOLATION" | "PASS";
			criterion: string;
			judgeModelEngineId: string;
			model?: unknown;
			confidence: number;
			confidenceThreshold: number;
			violated: boolean;
			lowConfidenceVerdict?: "PASS" | "BLOCK";
			reason: string;
	  } & (
			| {
					questionType: "NOUL";
					violationDirection: "YES" | "NO";
					probabilityYes: number;
					/** The typed NOUL result overwrites the original answer map. */
					answer: boolean;
			  }
			| {
					questionType: "CHOICE";
					criteria: Record<string, unknown>;
					violationChoices: string[];
					choice: string;
					answer: {
						choice: string;
						confidence: number;
						[key: string]: unknown;
					};
			  }
	  ));

type SqlCallerAccess = "NONE" | "READ_ONLY" | "EDIT" | "OWNER";

interface SqlGuardrailDetails {
	parser: "JSQLParser";
	dialectPolicy:
		| "GENERIC"
		| "POSTGRESQL"
		| "SQL_SERVER"
		| "MYSQL"
		| "MARIADB"
		| "ORACLE";
	callerAccess: SqlCallerAccess;
	classification: "ALLOWED" | "BLOCKED";
	violations: {
		type:
			| "QUERY"
			| "QUERY_LENGTH"
			| "PARSER_FAILURE"
			| "MULTI_STATEMENT"
			| "OPERATION"
			| "STRUCTURE"
			| "FUNCTION"
			| "VARIABLE"
			| "KEYWORD"
			| "RELATION"
			| "ROUTINE";
		value: string;
		required:
			| "FOLLOW_ENGINE_PERMISSIONS"
			| "READ_ONLY"
			| "EDIT"
			| "OWNER"
			| "DENY";
		actual: SqlCallerAccess;
	}[];
	parserStatus?: "PARSED" | "FAILED";
	parserError?: string;
	statementCount?: number;
	statement?: number;
	operations?: (
		| "SELECT"
		| "VALUES"
		| "EXPLAIN"
		| "SHOW"
		| "DESCRIBE"
		| "INSERT"
		| "UPDATE"
		| "DELETE"
		| "MERGE"
		| "UPSERT"
		| "REPLACE"
		| "CREATE_TABLE"
		| "CREATE_VIEW"
		| "CREATE_INDEX"
		| "ALTER_TABLE"
		| "ALTER_VIEW"
		| "DROP"
		| "TRUNCATE"
		| "COMMENT"
		| "SELECT_INTO"
		| "EXECUTE"
		| "BLOCK"
		| "SET"
		| "USE"
		| "DECLARE"
		| "COMMIT"
		| "SELECT_FOR_UPDATE"
		| "UNKNOWN"
	)[];
}

/** Same Security*Utils.getMetakeyOptions producers used by the config REST route. */
type ConfigOutput = Awaited<ReturnType<typeof getConfig>>;

/** MessageUtils writes schema-v2 parts and removes the legacy text/tool fields. */
type MessagePart =
	| { type: "TEXT"; text?: string; uiText?: string }
	| { type: "THINKING"; thinking?: string; source?: string }
	| { type: "SYSTEM"; prompt?: string }
	| {
			type: "MEDIA";
			mediaInfo?: {
				fileLocation?: string;
				fileName?: string;
				base64Data?: string;
				fileFormat?: string;
				mimeType?: string;
				sourceUrl?: string;
				mediaInputType?: "FILE" | "URL";
			};
	  }
	| { type: "TOOL_CALL"; toolCall?: Record<string, unknown> }
	| {
			type: "TOOL_RESULT";
			toolResult?: {
				toolCallId?: string;
				toolName?: string;
				output?: string;
				toolParameterValues?: Record<string, unknown>;
				toolStatus?: string;
				serverTool?: boolean;
			};
	  }
	| { type: "UNKNOWN"; data?: Record<string, unknown> };

export interface ModelMessage {
	schemaVersion: number;
	io: "INPUT" | "OUTPUT";
	parts: MessagePart[];
	type?: string;
	modelId?: string;
	modelType?: string;
	messageId?: string;
	transactionId?: string;
	parentMessageId?: string;
	summaryLeafMessageId?: string;
	agentRun?: {
		runId?: string;
		role?: string;
		originatingRunId?: string;
		childRunId?: string;
		completionMode?: string;
		childStatus?: string;
	};
	feedback?: {
		messageId?: string;
		feedbackText?: string;
		feedbackDate?: string;
		rating?: boolean;
	};
	tokens: number;
	cacheReadTokens?: number;
	cacheCreationTokens?: number;
	thinkingTokens?: number;
	visible: boolean;
	pruneToolsAbove: boolean;
	platform_generated: boolean;
	dateCreated?: string;
	ornaments?: Record<string, unknown>;
	paramMap?: Record<string, unknown>;
}

interface RoomExchange {
	inputMessage: ModelMessage;
	responseMessage: ModelMessage;
	extraMessages: {
		inputMessage: ModelMessage;
		responseMessage: ModelMessage;
	}[];
}

interface LegacyRoomMessage {
	MESSAGE_TYPE: "INPUT" | "RESPONSE" | "UNKNOWN";
	MESSAGE_DATA?: string;
	DATE_CREATED?: string;
	MESSAGE_ID?: string;
	MESSAGE_TYPE_FORMAT?: string;
}

interface WorkspaceEntry {
	workspace_id?: string;
	name?: string;
	description?: string;
	system_prompt?: string;
	owner?: string;
	is_active?: boolean;
	date_created?: string;
	date_updated?: string;
}

interface WorkspaceResource {
	id?: string;
	type?: string;
	name?: string;
	display_name?: string;
	description?: string;
	slug?: string;
}

interface FunctionDefinition {
	name?: string;
	description?: string;
	parameters: {
		type?: "object";
		properties?: Record<string, { type?: string; description?: string }>;
	};
	/** The Java producer inserts the required-name collection as one JSONArray item. */
	required: string[][];
}

interface RemoteModel {
	id?: string;
	name?: string;
	state?: "COLD" | "WARMING" | "ACTIVE" | "FAILED" | "UNKNOWN";
}

interface AccessRequest {
	ID?: string;
	REQUEST_USERID?: string;
	REQUEST_TYPE?: string;
	NAME?: string;
	EMAIL?: string;
	USERNAME?: string;
	REQUEST_TIMESTAMP?: string;
	PERMISSION?: number;
	APPROVER_USERID?: string;
	APPROVER_TYPE?: string;
	APPROVER_DECISION?: string;
	APPROVER_TIMESTAMP?: string;
}

interface ExtractedDependencies {
	success: Record<
		string,
		{
			engineType?: string;
			engineName?: string;
			files: { filename: string; instances: number }[];
		}
	>;
	failed: Record<
		string,
		{ files: { filename: string; instances: number }[] }
	>;
}

/** Query columns before optional reactor-level metadata aggregation. */
type CatalogQueryRow<T> = {
	[K in keyof T as string extends K ? never : K]?: T[K];
};

export type EngineCatalogRow = Omit<
	CatalogQueryRow<Awaited<ReturnType<typeof getEngines>>[number]>,
	"capabilities" | "upvotes" | "hasUpvoted"
>;

export type ProjectCatalogRow = CatalogQueryRow<
	Awaited<ReturnType<typeof getProjects>>[number]
>;

/** Reuses the identical REST producer, widening keys that metadata can promote to lists. */
type AppendedMetadata<T> = {
	[K in keyof T as string extends K ? never : K]?:
		| T[K]
		| (T[K] | string | null)[];
} & Record<string, unknown>;

/** Aggregate metadata is putAll over the base row and can replace any base key. */
type ReplacedMetadata<T> = {
	[K in keyof T as string extends K ? never : K]?:
		| T[K]
		| string
		| (string | null)[];
} & Record<string, unknown>;

type DiscoverableEngine = Pick<
	UploadedEngine,
	| "engine_id"
	| "engine_name"
	| "engine_display_name"
	| "engine_type"
	| "engine_subtype"
	| "engine_cost"
	| "engine_discoverable"
	| "engine_global"
	| "engine_created_by"
	| "engine_created_by_type"
	| "engine_date_created"
	| "low_engine_name"
>;
type DiscoverableProject = Pick<
	UploadedProject,
	| "project_id"
	| "project_name"
	| "project_display_name"
	| "project_type"
	| "project_cost"
	| "project_global"
	| "project_discoverable"
	| "project_catalog_name"
	| "project_created_by"
	| "project_created_by_type"
	| "project_date_created"
	| "project_date_last_edited"
	| "low_project_name"
>;

type ProjectInformation<T> = ReplacedMetadata<T> & {
	project_portal_url: string;
	project_remote_mcp?: boolean | string | (string | null)[];
	project_remote_mcp_endpoint?: string | (string | null)[];
	project_remote_mcp_auth_scheme?: string | (string | null)[];
	project_remote_mcp_auth_token?: string | (string | null)[];
	gh_projectId?: string | (string | null)[];
	gh_appId?: number | string | (string | null)[];
	gh_installationId?: number | string | (string | null)[];
	gh_repoId?: number | string | (string | null)[];
	gh_repoFullName?: string | (string | null)[];
	gh_branch?: string | (string | null)[];
	gh_subdir?: string | (string | null)[];
	gh_createdOn?: string | (string | null)[];
	gh_updatedOn?: string | (string | null)[];
};

interface ModelMetadata {
	engineId?: string;
	modelId?: string;
	catalogModelKey?: string;
	modelProvider?: string;
	servingProvider?: string;
	capability?: string;
	family?: string;
	inputModalities?: string[];
	outputModalities?: string[];
	contextWindow?: number;
	maxOutputTokens?: number;
	builtinTools?: Record<string, unknown>;
	attachment?: boolean;
	reasoning?: boolean;
	toolCall?: boolean;
	structuredOutput?: boolean;
	temperature?: boolean;
	knowledgeCutoff?: string;
	releaseDate?: string;
	supportedParameters?: string[];
	reasoningConfig?: Record<string, unknown>;
	benchmarks?: unknown[];
	pricing?: unknown[];
}

/** The metadata endpoint supplies empty defaults for missing capability values. */
interface ModelCapabilities {
	modelId: string;
	capability: string;
	family: string;
	inputModalities: string[];
	outputModalities: string[];
	contextWindow: number | "";
	maxOutputTokens: number | "";
	builtinTools: Record<string, unknown>;
	attachment?: boolean;
	reasoning?: boolean;
	toolCall?: boolean;
	structuredOutput?: boolean;
	temperature?: boolean;
	knowledgeCutoff: string;
	releaseDate: string;
	supportedParameters: string[];
	reasoningConfig: Record<string, unknown>;
	benchmarks: unknown[];
	pricing: unknown[];
}

type ModelSyncStatus =
	| "UPDATED"
	| "WOULD_UPDATE"
	| "NO_CHANGE"
	| "NO_CATALOG_ENTRY"
	| "NO_MODEL_ID"
	| "ERROR";
interface ModelSyncResult {
	engineId: string;
	modelId?: string;
	catalogModelKey?: string;
	changedFields: string[];
	status: ModelSyncStatus;
}

interface ModalityEmbedding {
	position: number;
	embedding?: number[];
	error?: string;
	truncated?: boolean;
}

interface UsageReportRow {
	messages: number;
	tokens?: number;
	avg_tokens?: number;
	last_utilized_date?: string;
}

interface InsightSearchRow {
	app_id?: string;
	app_name?: string;
	app_insight_id?: string;
	project_id?: string;
	project_name?: string;
	project_global?: boolean;
	project_catalog_name?: string;
	project_insight_id?: string;
	name?: string;
	view_count?: number;
	layout?: string;
	created_on?: string;
	last_modified_on?: string;
	cacheable?: boolean;
	cacheMinutes?: number;
	cacheCron?: string;
	cachedOn?: string;
	cacheEncrypt?: boolean;
	insight_global?: boolean;
	insight_schema_name?: string;
	low_name?: string;
	insight_permission?: number;
	project_permission?: number;
	insight_group_permission?: number;
	project_group_permission?: number;
	insight_favorite: boolean | number;
	permission?: number;
	description?: string;
	tags?: string[];
}

export type EnterpriseUsageRow = Partial<
	Record<
		| "REQUESTS"
		| "USERS"
		| "APPS"
		| "MODELS"
		| "ROOMS"
		| "INPUT_TOKENS"
		| "OUTPUT_TOKENS"
		| "TOKENS"
		| "TOKEN_ROWS"
		| "MESSAGE_ROWS"
		| "CACHE_READ_TOKENS"
		| "CACHE_ROWS"
		| "CACHE_CREATION_TOKENS"
		| "THINKING_TOKENS"
		| "THINKING_ROWS"
		| "RECORDED_COST_MICROS"
		| "ESTIMATED_COST_MICROS"
		| "COST_MICROS"
		| "COSTED_REQUESTS"
		| "PRICED_REQUESTS"
		| "LATENCY_MS"
		| "EVENTS"
		| "SUCCEEDED"
		| "FAILED"
		| "KNOWN_OUTCOMES"
		| "P95_MS"
		| "RATINGS"
		| "POSITIVE"
		| "ROW_NUM"
		| "USAGE_LIMIT_CHANGES"
		| "ACCESS_CHANGES"
		| "SETTING_CHANGES"
		| "DENIALS"
		| "ACTORS"
		| "PEOPLE_DENIED"
		| "PEOPLE_AFFECTED",
		number
	>
> &
	Partial<
		Record<
			| "DAY"
			| "ENTITY_ID"
			| "ENTITY_NAME"
			| "TIME"
			| "MESSAGE_ID"
			| "TRANSACTION_ID"
			| "MESSAGE_TYPE"
			| "USER_ID"
			| "USER_NAME"
			| "MODEL_ID"
			| "MODEL_NAME"
			| "APP_ID"
			| "APP_NAME"
			| "ROOM_ID"
			| "METHOD"
			| "USER_TYPE"
			| "BILLED_SOURCE_TYPE"
			| "BILLED_SUBJECT_ID"
			| "BILLED_SUBJECT_TYPE"
			| "LOG_ID"
			| "REQUEST_ID"
			| "ENGINE_ID"
			| "ENGINE_NAME"
			| "ENGINE_TYPE"
			| "LOG_LEVEL"
			| "EVENT_ID"
			| "EVENT_TIME"
			| "EVENT_TYPE"
			| "ACTION"
			| "STATUS"
			| "SEVERITY"
			| "ACTOR_USER_ID"
			| "ACTOR_USER_TYPE"
			| "ACTOR_USER_NAME"
			| "SUBJECT_USER_ID"
			| "SUBJECT_USER_TYPE"
			| "SUBJECT_USER_NAME"
			| "TARGET_TYPE"
			| "TARGET_ID"
			| "TARGET_NAME"
			| "PROJECT_ID"
			| "TARGET_DISPLAY_NAME"
			| "TARGET_ENGINE_TYPE"
			| "TARGET_ENGINE_SUBTYPE",
			string
		>
	> & { IS_SUCCESS?: boolean };

interface RangeMetadata {
	headers: string[];
	cleanHeaders: string[];
	dataTypes: Record<string, string>;
	additionalDataTypes: Record<string, string>;
}

interface LdapUserToken {
	provider?: string;
	userGroups?: (string | null)[];
	userGroupType?: string;
	id?: string;
	username?: string;
	access_token?: string;
	instance_url?: string;
	expires_in: number;
	token_type?: string;
	startTime: number;
	email?: string;
	name?: string;
	profile?: string;
	gender?: string;
	locale?: string;
	phone?: string;
	phoneExtension?: string;
	countryCode?: string;
	sans?: Record<string, string>;
	meta?: Record<string, (string | null)[]>;
	locked: boolean;
	lastLogin?: string;
	lastPasswordReset?: string;
}

interface NestedPixelReturn {
	output: unknown;
	operationType: string[];
	pixelId?: string;
	pixelExpression?: string;
	isMeta?: boolean;
	timeToRun?: number;
	additionalOutput?: NestedPixelReturn[];
}

/**
 * Successful resource outputs traced through their concrete producer and wire
 * serializer. Per-reactor source chains and remaining dynamic fields are recorded
 * in resource-output-evidence.json. These declarations are SDK implementation details.
 */
export interface ResourceOutputTypes {
	AddTemplate: Record<string, string>;
	DeleteTemplate: Record<string, string>;
	GetTemplateList: Record<string, string>;
	UpdateTemplate: Record<string, string>;
	GetPlaceHolders: Record<string, string[]>;
	BuildAndPublishApp: string;
	CompileAppReactors: (string | null)[];
	LoadApp: string;
	SetContext: string;
	GetProjectAvailableReactors: string[];
	AdminGetProjectAvailableReactors: string[];
	GetProjectReactorStatus: { isCompiled: boolean; isFailed: boolean };
	GetProjectReactorSignature: {
		description?: string;
		params: {
			name: string;
			type: string;
			required: boolean;
			description?: string;
		}[];
		template: string;
	};
	BrowseAppAssets: AssetEntry[];
	SearchAppAssets: AssetEntry[];
	BrowseEngineAssets: AssetEntry[];
	SearchEngineAssets: AssetEntry[];
	CreateAppFromBlocks: UploadedProject;
	CreateAppFromTemplate: UploadedProject;
	CreateNotebook: UploadedProject;
	CreateProject: UploadedProject;
	UploadProject: UploadedProject;
	CreateModelEngine: UploadedEngine;
	CreateStorageEngine: UploadedEngine;
	CreateVectorDatabaseEngine: UploadedEngine;
	CreateFunctionEngine: UploadedEngine;
	CreatePythonFunctionEngine: UploadedEngine;
	CreateEmptyRdbmsDatabase: UploadedEngine;
	CreateExternalDSEGraphDatabase: UploadedEngine;
	CreateExternalGraphDatabase: UploadedEngine;
	CreateExternalNeo4jDatabase: UploadedEngine;
	CreateJanusGraphDatabase: UploadedEngine;
	CreateNewRdbmsExternalDatabase: UploadedEngine;
	CreateNewRdbmsInternalDatabase: UploadedEngine;
	RCsvUpload: UploadedEngine;
	RdbmsCsvUpload: UploadedEngine;
	RdbmsLoaderSheetUpload: UploadedEngine;
	RdbmsUploadExcelData: UploadedEngine;
	RdbmsUploadTableData: UploadedEngine;
	RdfCsvUpload: UploadedEngine;
	RdfLoaderSheetUpload: UploadedEngine;
	TinkerCsvUpload: UploadedEngine;
	UploadDatabase: UploadedEngine;
	RReplaceDatabaseCsvUpload: UploadedEngine;
	RdbmsExternalUpload: UploadedEngine;
	RdbmsReplaceDatabaseCsvUpload: UploadedEngine;
	RdbmsReplaceDatabaseExcelUpload: UploadedEngine;
	RdbmsReplaceDatabaseLoaderSheetUpload: UploadedEngine;
	RdbmsReplaceDatabaseUploadTable: UploadedEngine;
	RdfReplaceDatabaseCsvUpload: UploadedEngine;
	RdfReplaceDatabaseLoaderSheetUpload: UploadedEngine;
	TinkerReplaceDatabaseCsvUpload: UploadedEngine;
	UploadEngine: UploadedEngine;
	ProjectCommitDetails: ProjectCommit[];
	EngineCommitDetails: EngineCommit[];
	ProjectCommitDiff: CommitDiff[];
	EngineCommitDiff: CommitDiff[];
	ProjectGitBranches: GitBranches;
	EngineGitBranches: GitBranches;
	ProjectGitCheckout: GitCheckout;
	EngineGitCheckout: GitCheckout;
	ProjectGitCreateBranch: GitCheckout;
	EngineGitCreateBranch: GitCheckout;
	ProjectGitDiff: GitDiff;
	EngineGitDiff: GitDiff;
	ProjectGitResolveConflict: GitResolvedConflict;
	EngineGitResolveConflict: GitResolvedConflict;
	ProjectGitStage: GitStatus;
	EngineGitStage: GitStatus;
	ProjectGitStatus: GitStatus;
	EngineGitStatus: GitStatus;
	ProjectGitDetails: { gitProvider?: string; gitRepo?: string };
	ListStoragePath: string[];
	ListStoragePathDetails: StorageEntry[];
	ListStorageVersions: StorageVersion[];
	PushToStorage: true | { success: true; versionId: string };
	SyncLocalToStorage: StorageSyncStatus;
	CreateEmbeddingsFromDocuments: string;
	CreateEmbeddingsFromVectorCSVFile: FileEmbeddingStatus[];
	AddWorkspace: string;
	DeleteWorkspace: true;
	EditWorkspace: true | { success: true; warning: string };
	CreateRoom: { roomId: string };
	EmbedderKeywordExtraction: string[];
	GetModelAPI: string;
	GetMyOpenAiKeyModelsList: string[];
	LLM2: ModelResponse;
	Vision: ModelResponse;
	Embeddings: Omit<ModelResponse, "response"> & {
		response?: number[][];
		metadata?: Record<string, unknown>;
	};
	TypeSafe: Omit<ModelResponse, "response"> & {
		response?: Record<string, unknown>;
	};
	OpenAIDecisions: Omit<ModelResponse, "response"> & {
		response?: Record<string, unknown>;
	};
	SubmitModelBatch: ModelBatchSubmission;
	BatchLLM: ModelBatchSubmission;
	GetModelBatchStatus: ModelBatchStatus;
	CancelModelBatch: ModelBatchStatus;
	OpenAIStreamPoll: { jobId: string; body: string; done: boolean };
	OpenAIPassthrough: {
		status: number;
		contentType: string;
		jobId?: string;
		/** Serialized OpenAI-compatible JSON, preserved as text by the reactor. */
		body?: string;
	};
	AdminGetSystemInfo: {
		hostname: string;
		ipaddress: string;
		isCluster: boolean;
		storageProvider?: string;
		isClusterScheduler: boolean;
		clusterContainerIp?: string;
		isClusterSync: boolean;
	};
	ExecuteGuardrailEngine: GuardrailResult;
	AggressiveSelfHarmGuardrailEngine: GuardrailWithDetails<PromptGuardrailDetails>;
	DetoxifyGuardrailEngine: GuardrailWithDetails<{
		threshold: number;
		return: Record<string, number | string>;
	}>;
	GLiNERGuardrailEngine: GuardrailWithDetails<{
		threshold: number;
		return: { score: number | string; [field: string]: unknown }[];
	}>;
	JevPolicyGuardrailEngine: GuardrailWithDetails<JevGuardrailDetails>;
	LocalPythonGuardrailReactorFunctionEngine: GuardrailResult;
	OnTopicGuardrailEngine: GuardrailWithDetails<{
		threshold: number;
		bestScore: number;
		limit: number;
		results: Record<string, unknown>[];
	}>;
	PolicyComplianceGuardrailEngine: GuardrailWithDetails<
		PromptGuardrailDetails | { classification: "SKIPPED_NO_TEXT" }
	>;
	PromptInjectionGuardrailEngine: GuardrailWithDetails<{
		modelName: string;
		threshold: number;
		maxLength: number;
		topLabel?: unknown;
		topScore?: number;
		blockLabel?: string;
		blockScore?: number;
		scoresByLabel: Record<string, number>;
		rawReturn: {
			top_label?: unknown;
			top_score?: number;
			scores: Record<string, unknown>[];
			scores_by_label: Record<string, number>;
		};
	}>;
	SqlQueryGuardrailEngine: GuardrailWithDetails<SqlGuardrailDetails>;
	GetDatabaseMetakeyOptions: ConfigOutput["databaseMetaKeys"];
	GetEngineMetakeyOptions: ConfigOutput["engineMetaKeys"];
	GetProjectMetakeyOptions: ConfigOutput["projectMetaKeys"];
	GetInsightMetakeyOptions: ConfigOutput["insightMetaKeys"];
	GetUserMetakeyOptions: ConfigOutput["userMetaKeys"];
	GetProjectPortalDetails: {
		project_is_published: boolean;
		project_portal_url: string;
	};
	AdminGetProjectPortalDetails: ResourceOutputTypes["GetProjectPortalDetails"];
	AdminGetSystemDatabaseSchema: {
		table: string;
		column: string;
		dataType: string;
	}[];
	GetAvailableTags: { tag?: string; count: number }[];
	GetInsightFrames: [
		insightId: string | null,
		projectId: string | null,
		tableName: string | null,
		tableType: string | null,
		columnName: string | null,
		columnType: string | null,
		additionalType: string | null,
	][];
	GetUserModelUsageRestrictions: Awaited<
		ReturnType<typeof getMyUsageLimitPath>
	>;
	AskRoom: RoomExchange;
	CompactRoomMessages:
		| { success: false; types: [] }
		| ({ type: "TOOL_PRUNE" | "SUMMARY" } & (
				| { success: false; error: string }
				| {
						success: true;
						inputMessage: ModelMessage;
						responseMessage: ModelMessage;
				  }
		  ))[];
	AddToolExecution: string | RoomExchange;
	GetRoomMessages: LegacyRoomMessage[];
	GetRoomMessages2: LegacyRoomMessage[];
	GetModelBatchResults: {
		batchId?: string;
		status?: string;
		count?: number;
		results: {
			customId?: string;
			status: "succeeded" | "errored";
			inputText?: string;
			numberOfTokensInPrompt?: number;
			numberOfTokensInResponse?: number;
			responseMessage?: ModelMessage;
			error?: unknown;
		}[];
	};
	GenerateFollowUpQuestions: { suggestions: string[] };
	GetRoomOptions: { OPTIONS?: Record<string, unknown>; ROOM_NAME?: string };
	GetUserConversationRooms: {
		ROOM_ID?: string;
		ROOM_NAME?: string;
		DATE_CREATED?: string;
		PINNED?: boolean;
		WORKSPACE_ID?: string;
	}[];
	SearchRoomMessages: {
		room_id?: string;
		room_name?: string;
		date_created?: string;
	}[];
	GetWorkspaceRooms: {
		total_count: number;
		rooms: {
			room_id?: string;
			room_name?: string;
			model_id?: string;
			workspace_id?: string;
			date_created?: string;
			date_updated?: string;
		}[];
	} | null;
	ListWorkspaces: {
		total_count: number;
		workspaces: (WorkspaceEntry & {
			is_creator?: boolean;
			permission?: string;
			number_collaborators: number;
		})[];
	};
	GetWorkspace: WorkspaceEntry & {
		/** Persisted caller-defined configuration; failed parsing can leave the JSON text. */
		config_json?: string | Record<string, unknown>;
		mcp: WorkspaceResource[];
		prompts: WorkspaceResource[];
		skills: WorkspaceResource[];
		permission?: string;
		number_collaborators: number;
		/** Configured MCP tool schemas may override the built-in definitions. */
		default_tools: Record<string, unknown>[];
		known_hook_kinds: string[];
	};
	GetAgentFormOptions: {
		default_tools: Record<string, unknown>[];
		known_hook_kinds: string[];
	};
	GetFunctionEngineDefinition: FunctionDefinition;
	GetGuardrailEngineDefinition: FunctionDefinition;
	MyRemoteModelsStatus: {
		activeModels: RemoteModel[];
		warmingModels: RemoteModel[];
	};
	GetModelGuardrailConfig: {
		engineId: string;
		configured: boolean;
		pipelineFileName?: string;
		fileExists: boolean;
		parseError?: string;
		rawContent?: string;
		pipelines: Record<string, unknown>;
		guardrailEngines: Record<
			string,
			{
				name?: string;
				exists: boolean;
				type?: string;
				subtype?: string;
				userCanView: boolean;
			}
		>;
		allowedReactorClasses: { input: string[]; output: string[] };
		interceptableMethods: {
			name: string;
			deprecated: boolean;
			returnType: string;
			returnsModelResponse: boolean;
			arguments: {
				name: string;
				position: number;
				nameIsFromSource: boolean;
				type: string;
				guardable: boolean;
				carriesToolResults: boolean;
			}[];
		}[];
		resultArgumentName: string;
	};
	DatabaseColumnUnique: {
		isUnique: boolean;
		numRow: number;
		uniqueRow: number;
	};
	GetUDF: string[];
	GetOwlDescriptions: (string | null)[];
	GetOwlLogicalNames: string[];
	PredictOwlDescription: (string | null)[];
	PredictOwlLogicalNames: string[];
	ExternalJdbcTablesAndViews: {
		tables: string[];
		tableSchemas: (string | null)[];
		views: string[];
		viewSchemas: (string | null)[];
	};
	ExternalUpdateJdbcTablesAndViews: { tables: string[]; views: string[] };
	ExternalJdbcSchema: {
		tables: {
			table: string;
			columns?: string[];
			raw_type?: string[];
			type?: string[];
			isPrimKey?: boolean[];
		}[];
		relationships: {
			fromTable: string;
			fromCol?: string;
			toTable: string;
			toCol?: string;
		}[];
		positions: Record<string, Record<string, number>>;
	};
	ExternalUpdateJdbcSchema: ResourceOutputTypes["ExternalJdbcSchema"];
	GetDatabaseMetaValues: {
		METAKEY?: string;
		METAVALUE?: string;
		count: number;
	}[];
	GetEngineMetaValues: ResourceOutputTypes["GetDatabaseMetaValues"];
	GetInsightMetaValues: ResourceOutputTypes["GetDatabaseMetaValues"];
	GetProjectMetaValues: ResourceOutputTypes["GetDatabaseMetaValues"];
	GetUserMetadata: Record<string, (string | null)[]>;
	ValidateProjectDependencies: Record<string, boolean>;
	ValidateUserProjectDependencies: Record<string, boolean>;
	GetEngineUserAccessRequest: (AccessRequest & { ENGINEID?: string })[];
	GetDatabaseUserAccessRequest: ResourceOutputTypes["GetEngineUserAccessRequest"];
	GetProjectUserAccessRequest: (AccessRequest & { PROJECTID?: string })[];
	ExtractAndSetDependencies: { engineIds: ExtractedDependencies };
	UploadProjectApp: UploadedProject & { engineIds: ExtractedDependencies };
	ReplaceInaccessibleEngines: {
		success: Record<string, { files: string[]; engineName?: string }>;
		failed: Record<string, string[]>;
	};
	GetAppBlocksJson: Record<string, unknown>;
	GetProjectAuthorizationHeader: { projectId: string };
	AdminLockAccountWarning: string[];
	GetProjectDependencies: {
		engines: {
			engine_id?: string;
			engine_type?: string;
			engine_name?: string;
			engine_subtype?: string;
			engine_date_created?: string;
			engine_discoverable?: boolean;
			engine_global?: boolean;
			description?: string;
			tags?: string;
			permission?: number;
			group_permission?: number;
			access_permission?: number;
			can_view_dependencies: boolean;
			permission_name?: string;
			dependencies?: string[];
		}[];
		dependencies: string[];
	};
	GetSpecificInsightMeta: {
		description: string;
		tags: (string | null)[];
		cacheable?: boolean;
		cacheMinutes?: number;
		cacheCron?: string;
		cacheOn?: string;
		cacheEncrypt?: boolean;
		global: boolean;
	};
	PredictDataTypes: {
		headers: string[];
		cleanHeaders: string[];
		dataTypes: Record<string, string>;
		additionalDataTypes: Record<string, string>;
		endRow?: number;
	};
	PredictParquetDataTypes: {
		headers: string[];
		cleanHeaders: string[];
		dataTypes: Record<string, string>;
	};
	MyEngines: (AppendedMetadata<EngineCatalogRow> & {
		capabilities?: ModelCapabilities | string | (string | null)[];
		upvotes?: number | string | (string | null)[];
		hasUpvoted?: boolean | string | (string | null)[];
	})[];
	MyProjects: AppendedMetadata<
		Awaited<ReturnType<typeof getProjects>>[number]
	>[];
	AdminMyEngines: AppendedMetadata<
		Awaited<ReturnType<typeof getAdminEngines>>[number]
	>[];
	AdminMyProjects: AppendedMetadata<
		Awaited<ReturnType<typeof getAdminProjects>>[number]
	>[];
	AdminDatabase: QueryStructWireOutput;
	AdminSqlQuery: true | TaskCollectionOutput<TableTaskData>;
	GetModelMetadata: ModelMetadata & {
		effectiveServingProvider?: string;
		costPriceEntry?: Record<string, unknown>;
		costPriceForServingProvider: boolean;
	};
	UpdateModelMetadata: ModelMetadata | null;
	ApplyModelCatalogMetadata: ModelSyncResult;
	SyncModelMetadata: Record<ModelSyncStatus, number> & {
		total: number;
		force: boolean;
		dryRun: boolean;
		results: ModelSyncResult[];
	};
	GetStaticModelMetadata: Record<string, unknown>;
	ListStaticModelCatalog: Record<
		string,
		{
			key: string;
			modelId: string;
			name?: string;
			description?: string;
			family?: string;
			provider?: string;
			releaseDate?: string;
			contextLimit?: number;
			outputLimit?: number;
			inputModalities: string[];
			outputModalities: string[];
			reasoning?: boolean;
			toolCall?: boolean;
		}[]
	>;
	MatchStaticModelMetadata: {
		modelId?: string;
		exactMatch?: string;
		matches: {
			key: string;
			id?: string;
			name?: string;
			provider?: string;
			family?: string;
			score: number;
		}[];
		allKeys: string[];
	};
	GetAllEngineUsage: {
		MESSAGE_ID?: string;
		MESSAGE_TYPE?: string;
		MESSAGE_TOKENS?: number;
		MESSAGE_METHOD?: string;
		DATE_CREATED?: string;
		AGENT_NAME?: string;
		PROJECT_NAME?: string;
	}[];
	AdminGetAllEngineUsage: ResourceOutputTypes["GetAllEngineUsage"];
	GetEngineUsagePerProject: {
		PROJECT_NAME?: string;
		TOTAL_NUMBER_OF_TOKENS?: number;
		TOTAL_NUMBER_OF_REQUEST: number;
		PROJECT_ID?: string;
	}[];
	AdminGetEngineUsagePerProject: ResourceOutputTypes["GetEngineUsagePerProject"];
	GetEngineUsagePerUser: {
		USER_NAME?: string;
		USER_ID?: string;
		TOTAL_NUMBER_OF_TOKENS?: number;
	}[];
	AdminGetEngineUsagePerUser: ResourceOutputTypes["GetEngineUsagePerUser"];
	AdminGetProjectUsage: { Unique_Calls: number };
	GetUserModelUsage: {
		ENGINE_ID?: string;
		ENGINE_NAME?: string;
		INPUT_TOKENS?: number;
		RESPONSE_TOKENS?: number;
		TOTAL_TOKENS?: number;
		TOTAL_REQUESTS: number;
		TOKEN_DETAIL: {
			INPUT_TOKENS: number;
			OUTPUT_TOKENS: number;
			CACHE_READ_TOKENS: number;
			CACHE_CREATION_TOKENS: number;
			THINKING_TOKENS: number;
		};
	}[];
	GetUsageStatistics:
		| {
				appReport: (UsageReportRow & {
					project_name?: string;
					project_id?: string;
				})[];
		  }
		| {
				userReport: (UsageReportRow & {
					user?: string;
					user_id?: string;
				})[];
		  }
		| { error: string };
	ListModelBatches: {
		batches: {
			batchId?: string;
			submittedAt?: string;
			engineId?: string;
			requestCount?: number;
		}[];
	};
	AdminGetLlmFeedback: {
		MESSAGE_ID?: string;
		MESSAGE_TYPE?: string;
		FEEDBACK_TEXT?: string;
		FEEDBACK_DATE?: string;
		RATING?: boolean;
		USER_ID?: string;
		USER_NAME?: string;
		AGENT_ID?: string;
		DATE_CREATED?: string;
		MESSAGE_DATA?: string;
		TRANSACTION_ID?: string;
		PROJECT_ID?: string;
		PROJECT_NAME?: string;
		WORKSPACE_ID: string;
		PROMPT?: string;
	}[];
	AdminGetLlmFeedbackCount: {
		TOTAL_FEEDBACK: number;
		POSITIVE_FEEDBACK?: number;
		NEGATIVE_FEEDBACK?: number;
	}[];
	NER: {
		response?: {
			status: string;
			message?: string;
			code?: number;
			mask_values?: Record<string, string>;
			entities?: string[];
			raw_output?: {
				start: number;
				end: number;
				text: string;
				label: string;
				score: number;
			}[];
			output?: string;
			input?: string;
		};
		numberOfTokensInPrompt?: number;
		numberOfTokensInResponse?: number;
		numberOfCacheReadTokens?: number;
		numberOfCacheCreationTokens?: number;
		numberOfThinkingTokens?: number;
		usageRestriction?: Record<string, unknown>;
		usageLimits?: Record<string, unknown>;
		usageCapped: boolean;
		messageId?: string;
		roomId?: string;
	};
	MultiModalEmbeddings:
		| { implemented: false; response?: string }
		| {
				text: ModalityEmbedding[];
				image: ModalityEmbedding[];
				video: ModalityEmbedding[];
				numberOfTokensInPrompt?: number;
				metadata?: Record<string, unknown>;
		  }
		| ({ messageType: "ERROR" } & Record<string, unknown>);
	/** OpenSearch can append a source-keyed metadata map, in addition to file rows. */
	ListDocumentsInVectorDatabase: (
		| { fileName?: string; fileSize?: number; lastModified?: string }
		| Record<string, Record<string, unknown>>
	)[];
	GetWorkspaceKnowledgeBase: ResourceOutputTypes["ListDocumentsInVectorDatabase"];
	/** Faiss/Pinecone/OpenSearch preserve caller-defined record columns and metadata. */
	ListAllRecordsInVectorDatabase: Record<string, unknown>[];
	VectorDatabaseQuery: Record<string, unknown>[];
	MyDatabases: ResourceOutputTypes["MyEngines"];
	MyDiscoverableDatabases: AppendedMetadata<DiscoverableEngine>[];
	MyDiscoverableEngines: AppendedMetadata<DiscoverableEngine>[];
	MyDiscoverableProjects: AppendedMetadata<DiscoverableProject>[];
	DatabaseInfo: ReplacedMetadata<UploadedEngine>;
	EngineInfo: ReplacedMetadata<UploadedEngine>;
	GetDatabaseMetadata: ReplacedMetadata<UploadedEngine> & {
		last_updated?: string;
	};
	GetEngineMetadata: ReplacedMetadata<UploadedEngine> & {
		last_updated?: string;
		pending_access_request?: number | string | (string | null)[];
		capabilities?: ModelCapabilities | string | (string | null)[];
	};
	AdminEngineInfo: ReplacedMetadata<
		Awaited<ReturnType<typeof getAdminEngines>>[number]
	>;
	ProjectInfo: ProjectInformation<UploadedProject>;
	AdminProjectInfo: ProjectInformation<
		Awaited<ReturnType<typeof getAdminProjects>>[number]
	>;
	DatabaseUsers: Partial<
		Awaited<ReturnType<typeof getEngineUsers>>["members"][number]
	>[];
	DatabaseUsersReactor: ResourceOutputTypes["DatabaseUsers"];
	GetInsights: InsightSearchRow[];
	GetAppInsights: InsightSearchRow[];
	GenerateEngineMetadata: {
		generated_metadata: {
			description?: string;
			tags?: string[];
			explanation?: string;
			[field: string]: unknown;
		};
		generated_fields: string[];
		options_used: Record<string, unknown>;
		engine_type: string;
		engine_name?: string;
		data_sent_summary: Record<
			| "engineType"
			| "schema"
			| "vectorFiles"
			| "vectorChunkSamples"
			| "storageFiles"
			| "storageFileSamples"
			| "modelSmssInfo"
			| "funcSmssInfo"
			| "additionalContext"
			| "existingDescription",
			boolean
		>;
		explanation?: string;
	};
	Command: string;
	AddDatabaseStructure: {
		combinedErrors: string;
		successfulUpdates: string[];
		failedUpdates: string[];
	};
	DeleteDatabaseStructure: ResourceOutputTypes["AddDatabaseStructure"];
	GetDSEGraphProperties: string[];
	GetGraphProperties: string[];
	GetJanusGraphProperties: string[];
	GetDatabaseTablePhysicalStructure: Record<string, string>;
	GetJanusGraphMetaModel: {
		nodes?: Record<string, Record<string, string>>;
		edges?: Record<string, [string, string]>;
	};
	GetGraphMetaModel: {
		nodes: Record<string, Record<string, string>>;
		edges: Record<string, [string, string]>;
		positions: Record<string, { left: number; top: number }>;
	};
	GetDSEGraphMetaModel: ResourceOutputTypes["GetGraphMetaModel"];
	GetOwlDictionary: {
		table: string;
		column: string;
		isPrimKey: boolean;
		dataType: string;
		description: string[];
		logical: string[];
	}[];
	GetOwlMetamodel: {
		nodeProp: { conceptualName: string; propSet: string[] }[];
		relationProp: { source: string; target: string; rel: string }[];
		positions: Record<string, { left: number; top: number }>;
	};
	AdminGetEnterpriseUsage: {
		rows: EnterpriseUsageRow[];
		limit: number;
		source: "model" | "activity" | "audit";
	};
	AdminGetEnterpriseUsageDetail: {
		rows: {
			LOG_ID?: string;
			MESSAGE?: string;
			REQUEST?: string;
			RESPONSE?: string;
			MESSAGE_ID?: string;
			MESSAGE_TYPE?: string;
			MESSAGE_DATA?: string;
			DATE_CREATED?: string;
			MESSAGE_TOKENS?: number;
			RESPONSE_TIME?: number;
			EVENT_ID?: string;
			OLD_VALUE?: string;
			NEW_VALUE?: string;
			DETAILS?: string;
			ERROR_CODE?: string;
			ERROR_MESSAGE?: string;
		}[];
		limit: number;
		source: "model" | "activity" | "audit";
	};
	AdminGetEnterpriseUsageFilterOptions: {
		rows: {
			ENTITY_ID?: string;
			ENTITY_NAME?: string;
			ENTITY_TYPE?: string;
			ENTITY_SUBTYPE?: string;
		}[];
		hasMore: boolean;
		limit: number;
		offset: number;
	};
	PredictExcelDataTypes: Record<string, Record<string, RangeMetadata>>;
	PredictExcelRangeMetadata: RangeMetadata;
	PredictMetamodel: {
		startCount: 2;
		endCount?: number;
		dataTypes: Record<string, string>;
		additionalDataTypes: Record<string, string>;
		headerModifications: Record<string, string>;
		relation: { fromTable: string; toTable: string; relName: string }[];
		nodeProp: Record<string, string[]>;
		positions: Record<string, { top: number; left: number }>;
		fileLocation: string;
		fileName: string;
	};
	SimilarCatalog:
		| string
		| (Awaited<ReturnType<typeof getEngines>>[number] & {
				markdown?: string | string[];
				description?: string | string[];
				tag?: string | string[];
				domain?: string | string[];
				upvotes?: number;
		  })[];
	AdminLoadLdapUsers: {
		addedUsers: LdapUserToken[];
		updatedUsers: LdapUserToken[];
		foundUsers: LdapUserToken[];
	};
	CanItRun: Record<string, unknown>;
	GetRemoteModelDeployConfigs: Record<string, unknown>;
	GetNodePoolsInfo: {
		message?: string;
		zk_info?: Record<string, unknown>;
		pools?: Record<string, unknown>[];
		active_models_actual?: Record<string, unknown>;
	};
	GetModelBuiltinTools: {
		engineId: string;
		modelId: string;
		modelProvider: string;
		servingProvider: string;
		tools: Record<string, Record<string, unknown>>;
		selected: Record<string, unknown>;
	};
	ProjectPy: { output: string; operationType: string[] }[];
	ProjectPyBase64: ResourceOutputTypes["ProjectPy"];
	EnginePy: ResourceOutputTypes["ProjectPy"];
	ProjectR: { output: string | null; operationType: string[] }[];
	ExecuteAppNotebook: {
		name: string | null;
		core_engine: string | null;
		core_engine_id: string | null;
		recipe: string[];
		variableOutput?: Record<string, unknown>;
		insightData: { insightID: string; pixelReturn: NestedPixelReturn[] };
	};
	ParseMetamodel: {
		fileLocation: string;
		fileName: string;
		headerModifications: Record<string, string>;
		additionalDataTypes: Record<string, never>;
		positions: Record<string, { left: number; top: number }>;
		[key: string]: unknown;
	};
	/** The producer checks these keys exist but does not validate their model-supplied values. */
	TextToSQL: {
		question?: unknown;
		sql?: unknown;
		explanation?: unknown;
		[key: string]: unknown;
	};
	/** Configured function engines may return any JSON-compatible result. */
	ExecuteFunctionEngine: unknown;
	ExecuteReactorFunctionEngine: unknown;
	ExecuteStreamingFunctionEngine: unknown;
	Rerank: unknown;
}
