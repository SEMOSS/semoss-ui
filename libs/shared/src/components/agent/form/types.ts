import type { MCPConfig, SkillConfig } from "../../../types";
import type { AgentHook } from "../agent.types";

type SubagentEntry = {
	workspaceId: string;
};

/** Max length for the agent's scripted opening message. Mirrors EditWorkspaceReactor's server-side cap. */
export const AGENT_MAX_GREETING_LENGTH = 2000;

/**
 * Shared shape for both the create and edit agent forms. The edit form omits
 * a `name` control (workspaces aren't renamed from that page) but keeps the
 * field so loaded/unchanged values still round-trip through EditWorkspace.
 */
export type AgentFormValues = {
	name: string;
	description: string;
	instructions: string;
	greeting: string;
	greetingEnabled: boolean;
	modelId: string;
	useDefaultAgentTools: boolean;
	disabledDefaultTools: string[];
	maxTurns: string;
	maxReflections: string;
	maxSeconds: string;
	maxSubagentDepth: string;
	maxSubagentsPerRun: string;
	maxSpawnsPerTurn: string;
	knowledge: MCPConfig[];
	toolboxes: MCPConfig[];
	skills: SkillConfig[];
	prompts: string[];
	subagents: SubagentEntry[];
	hooks: AgentHook[];
};

export const AGENT_FORM_DEFAULT_VALUES: AgentFormValues = {
	name: "",
	description: "",
	instructions: "",
	greeting: "",
	greetingEnabled: false,
	modelId: "",
	useDefaultAgentTools: true,
	disabledDefaultTools: [],
	maxTurns: "",
	maxReflections: "",
	maxSeconds: "",
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
