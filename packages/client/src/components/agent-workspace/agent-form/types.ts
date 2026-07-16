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
};
