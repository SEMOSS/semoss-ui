import type { MCPConfig, SkillConfig } from "@semoss/shared";

export type SubagentEntry = {
	alias: string;
	workspaceId: string;
	description: string;
};

export type ModelEngine = {
	engine_id: string;
	engine_name: string;
	tag: string;
};

/**
 * One CONFIG_JSON.hooks[] entry. `pixel`/`events` only apply to `kind ===
 * "pixel"` - the other known kinds (git_commit, log_tools, ppt_to_pdf) carry
 * no per-instance fields today. Kept loose (not a discriminated union) since
 * the backend persists entries as-is and future kinds may add their own
 * fields this form doesn't need to know about.
 */
export type HookEntry = {
	kind: string;
	pixel?: string;
	events?: string[];
};

/** The only kind with configurable fields today. */
export const PIXEL_HOOK_KIND = "pixel";

/**
 * Lifecycle event names `PixelReactorHook` filters on. Not returned by any
 * API (only `knownKinds` is) since this is specific to the `pixel` kind -
 * mirrors `PixelReactorHook.KNOWN_EVENTS` in Semoss.
 */
export const PIXEL_HOOK_EVENTS = [
	"onRoomCreation",
	"beforeRun",
	"afterAgentInit",
	"beforeTool",
	"afterTool",
	"afterRun",
	"beforeAgentDeInit",
] as const;

/**
 * One-line description shown for hook kinds with no configurable fields.
 * Mirrors each hook's Java doc comment in `prerna.reactor.agent.hooks`.
 */
export const HOOK_KIND_DESCRIPTIONS: Record<string, string> = {
	git_commit: "Runs git add . && git commit after each agent run.",
	log_tools: "Logs each tool call's name, params, and duration.",
	ppt_to_pdf: "Converts the run's output file to PDF afterward.",
};

/**
 * Shared shape for both the create and edit agent forms. The edit form omits
 * a `name` control (workspaces aren't renamed from that page) but keeps the
 * field so loaded/unchanged values still round-trip through EditWorkspace.
 */
export type AgentFormValues = {
	name: string;
	description: string;
	instructions: string;
	modelId: string;
	maxTurns: string;
	maxReflections: string;
	maxSubagentDepth: string;
	maxSubagentsPerRun: string;
	maxSpawnsPerTurn: string;
	knowledge: MCPConfig[];
	toolboxes: MCPConfig[];
	skills: SkillConfig[];
	prompts: string[];
	subagents: SubagentEntry[];
	hooks: HookEntry[];
};

export const AGENT_FORM_DEFAULT_VALUES: AgentFormValues = {
	name: "",
	description: "",
	instructions: "",
	modelId: "",
	maxTurns: "",
	maxReflections: "",
	maxSubagentDepth: "",
	maxSubagentsPerRun: "",
	maxSpawnsPerTurn: "",
	knowledge: [],
	toolboxes: [],
	skills: [],
	prompts: [],
	subagents: [],
	hooks: [],
};
