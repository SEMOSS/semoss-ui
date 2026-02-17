// ─── Step Type Enum ──────────────────────────────────────────────
export const STEP_TYPES = {
	STATIC: "STATIC",
	LLM_ASK: "LLM_ASK",
	LLM_AGENT: "LLM_AGENT",
	RUN_TOOL: "RUN_TOOL",
	RUN_PIXEL: "RUN_PIXEL",
	CONDITION: "CONDITION",
	OUTPUT: "OUTPUT",
} as const;

export type StepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES];

// Future step types — shown as disabled in the palette
export const FUTURE_STEP_TYPES = [
	"LOOP",
	"TRANSFORM",
	"HUMAN_INPUT",
	"GUARDRAIL",
	"RUN_PYTHON",
] as const;

export type FutureStepType = (typeof FUTURE_STEP_TYPES)[number];

// ─── Step Category (palette grouping) ────────────────────────────
export interface StepCategoryDef {
	label: string;
	types: readonly StepType[];
}

export const STEP_CATEGORIES: StepCategoryDef[] = [
	{ label: "AI", types: [STEP_TYPES.LLM_ASK, STEP_TYPES.LLM_AGENT] },
	{ label: "Engine", types: [STEP_TYPES.RUN_TOOL] },
	{ label: "Data", types: [STEP_TYPES.RUN_PIXEL] },
	{ label: "Logic", types: [STEP_TYPES.CONDITION] },
	{ label: "I/O", types: [STEP_TYPES.STATIC, STEP_TYPES.OUTPUT] },
];

// ─── Human-readable labels per step type ─────────────────────────
export const STEP_TYPE_LABELS: Record<StepType, string> = {
	STATIC: "Static Value",
	LLM_ASK: "LLM Ask",
	LLM_AGENT: "LLM Agent",
	RUN_TOOL: "Use Engine",
	RUN_PIXEL: "Run Pixel",
	CONDITION: "Condition",
	OUTPUT: "Output",
};

// ─── Palette entry variants ──────────────────────────────────────
// A "variant" lets the palette show multiple items that map to the
// same underlying step type with different default configs.
export type PaletteVariant = "engine" | "project";

export interface PaletteEntry {
	/** Unique key for this palette entry */
	key: string;
	/** Underlying step type in workflow.json */
	stepType: StepType;
	/** Label shown in the palette */
	label: string;
	/** Optional variant identifier carried via drag-and-drop */
	variant?: PaletteVariant;
}

/** Extended palette items for each category */
export const PALETTE_ENTRIES: Record<string, PaletteEntry[]> = {
	AI: [
		{ key: "LLM_ASK", stepType: STEP_TYPES.LLM_ASK, label: "LLM Ask" },
		{
			key: "LLM_AGENT",
			stepType: STEP_TYPES.LLM_AGENT,
			label: "LLM Agent",
		},
	],
	Engine: [
		{
			key: "RUN_TOOL",
			stepType: STEP_TYPES.RUN_TOOL,
			label: "Use Engine",
			variant: "engine",
		},
		{
			key: "USE_APP",
			stepType: STEP_TYPES.RUN_TOOL,
			label: "Use App",
			variant: "project",
		},
	],
	Data: [
		{
			key: "RUN_PIXEL",
			stepType: STEP_TYPES.RUN_PIXEL,
			label: "Run Pixel",
		},
	],
	Logic: [
		{
			key: "CONDITION",
			stepType: STEP_TYPES.CONDITION,
			label: "Condition",
		},
	],
	"I/O": [
		{ key: "STATIC", stepType: STEP_TYPES.STATIC, label: "Static Value" },
		{ key: "OUTPUT", stepType: STEP_TYPES.OUTPUT, label: "Output" },
	],
};

// ─── Engine types available for RUN_TOOL step ────────────────────
export const ENGINE_STEP_TYPES = ["VECTOR", "STORAGE", "FUNCTION"] as const;
export type EngineStepType = (typeof ENGINE_STEP_TYPES)[number];

export const ENGINE_STEP_TYPE_LABELS: Record<EngineStepType, string> = {
	VECTOR: "Vector Database",
	STORAGE: "File Storage",
	FUNCTION: "Function",
};

// ─── Per-step-type config schemas ────────────────────────────────
export interface StaticConfig {
	value: unknown;
}

export interface LLMAskConfig {
	modelId: string;
	systemPrompt?: string;
	userPrompt: string;
	paramMap?: {
		temperature?: number;
		max_tokens?: number;
		[key: string]: unknown;
	};
}

export interface LLMAgentConfig {
	modelId: string;
	systemPrompt?: string;
	userPrompt: string;
	toolEngineIds: string[];
	paramMap?: {
		temperature?: number;
		max_tokens?: number;
		[key: string]: unknown;
	};
	maxIterations?: number;
}

export interface RunToolConfig {
	engineType: EngineStepType | "";
	engineId: string;
	toolName: string;
	params: Record<string, unknown>;
	/** UI-only: distinguishes "Use Engine" vs "Use App" in the palette */
	source?: "engine" | "project";
}

export interface RunPixelConfig {
	recipe: string;
}

export type ConditionOperator =
	| "=="
	| "!="
	| ">"
	| "<"
	| ">="
	| "<="
	| "contains"
	| "empty"
	| "notEmpty";

export const CONDITION_OPERATORS: {
	value: ConditionOperator;
	label: string;
}[] = [
	{ value: "==", label: "equals (==)" },
	{ value: "!=", label: "not equals (!=)" },
	{ value: ">", label: "greater than (>)" },
	{ value: "<", label: "less than (<)" },
	{ value: ">=", label: "greater or equal (>=)" },
	{ value: "<=", label: "less or equal (<=)" },
	{ value: "contains", label: "contains" },
	{ value: "empty", label: "is empty" },
	{ value: "notEmpty", label: "is not empty" },
];

export interface ConditionConfig {
	left: string;
	operator: ConditionOperator;
	right: unknown;
}

export interface OutputConfig {
	value: string;
}

export type StepConfig =
	| StaticConfig
	| LLMAskConfig
	| LLMAgentConfig
	| RunToolConfig
	| RunPixelConfig
	| ConditionConfig
	| OutputConfig;

// ─── Position ────────────────────────────────────────────────────
export interface Position {
	x: number;
	y: number;
}

// ─── Workflow Step ───────────────────────────────────────────────
export interface WorkflowStep {
	stepId: string;
	type: StepType;
	name: string;
	description?: string;
	position: Position;
	config: StepConfig;
	inputs: Record<string, string>;
	next: string[] | null;
	ifTrue: string[] | null;
	ifFalse: string[] | null;
}

// ─── Workflow Settings ───────────────────────────────────────────
export interface WorkflowSettings {
	maxSteps: number;
	timeoutMs: number;
	onError: "stop" | "skip";
}

// ─── Workflow Document ───────────────────────────────────────────
export interface Workflow {
	workflowId: string;
	name: string;
	version: number;
	variables: Record<string, unknown>;
	settings: WorkflowSettings;
	steps: WorkflowStep[];
}

// ─── Execution ───────────────────────────────────────────────────
export type ExecutionStatus = "SUCCESS" | "ERROR" | "TIMEOUT";

export interface WorkflowExecution {
	executionId: string;
	status: ExecutionStatus;
	durationMs: number;
	triggeredBy: string;
	startTimeMs: number;
	endTimeMs: number;
	error?: string;
}

// ─── API Responses ───────────────────────────────────────────────
export interface WorkflowStatusResponse {
	projectId: string;
	projectName: string;
	projectType: string;
	workflow: Workflow | null;
	executions: WorkflowExecution[];
}

export interface RunWorkflowResponse {
	executionId: string;
	workflowId: string;
	status: ExecutionStatus;
	durationMs: number;
	triggeredBy: string;
	finalOutput: unknown;
	error: string | null;
}

export interface CreateWorkflowResponse {
	project_id: string;
	project_name: string;
	project_type: string;
}

// ─── Default factory helpers ─────────────────────────────────────

/** Default workflow settings */
export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
	maxSteps: 50,
	timeoutMs: 300_000,
	onError: "stop",
};

/** Default config for each step type */
export const DEFAULT_STEP_CONFIGS: Record<StepType, StepConfig> = {
	STATIC: { value: "" } satisfies StaticConfig,
	LLM_ASK: {
		modelId: "",
		systemPrompt: "",
		userPrompt: "",
	} satisfies LLMAskConfig,
	LLM_AGENT: {
		modelId: "",
		systemPrompt: "",
		userPrompt: "",
		toolEngineIds: [],
		maxIterations: 10,
	} satisfies LLMAgentConfig,
	RUN_TOOL: {
		engineType: "",
		engineId: "",
		toolName: "",
		params: {},
	} satisfies RunToolConfig,
	RUN_PIXEL: { recipe: "" } satisfies RunPixelConfig,
	CONDITION: {
		left: "",
		operator: "==",
		right: "",
	} satisfies ConditionConfig,
	OUTPUT: { value: "" } satisfies OutputConfig,
};

/** Create a new empty step of the given type at the given position */
export function createStep(
	type: StepType,
	position: Position,
	name?: string,
): WorkflowStep {
	return {
		stepId: crypto.randomUUID(),
		type,
		name: name ?? STEP_TYPE_LABELS[type],
		description: "",
		position,
		config: structuredClone(DEFAULT_STEP_CONFIGS[type]),
		inputs: {},
		next: null,
		ifTrue: null,
		ifFalse: null,
	};
}

/** Create an empty workflow scaffold */
export function createEmptyWorkflow(
	workflowId: string,
	name: string,
): Workflow {
	return {
		workflowId,
		name,
		version: 1,
		variables: {},
		settings: { ...DEFAULT_WORKFLOW_SETTINGS },
		steps: [],
	};
}
