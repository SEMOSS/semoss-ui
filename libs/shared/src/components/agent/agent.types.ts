import type { MCPConfig, SkillConfig } from "../../types";

/** One CONFIG_JSON.hooks[] entry. `pixel`/`events` only apply to the `pixel` kind. */
export type AgentHook = {
	kind: string;
	pixel?: string;
	events?: string[];
	bindings?: Record<string, string>;
};

/** One entry of a deployment's built-in agent tool catalog. */
export type AgentDefaultTool = {
	name: string;
	title?: string;
	description?: string;
};

/** One lifecycle value a hook runtime can bind, and the events that provide it. */
export type AgentHookBindingSource = {
	source: string;
	events: string[];
};

/** Configuration metadata exposed by an unconfigured hook runtime. */
export type AgentHookCapability = {
	events: string[];
	binding_sources?: AgentHookBindingSource[];
};

export type AgentHookCapabilities = Record<string, AgentHookCapability>;

/** `GetWorkspace`'s response, as rendered by the agent views. */
export type AgentWorkspace = {
	name: string;
	description: string;
	system_prompt: string;
	/** `name` is the canonical catalog name; `display_name` is what to render. */
	mcp: (MCPConfig & { display_name?: string; description?: string })[];
	skills: (SkillConfig & { description?: string })[];
	prompts: { id: string; name: string; type: string }[];
	known_hook_kinds?: string[];
	hook_capabilities?: AgentHookCapabilities;
	default_tools?: AgentDefaultTool[];
	config_json?: {
		model_id?: string;
		use_default_agent_tools?: boolean;
		greeting?: string;
		greeting_enabled?: boolean;
		tool_policy?: {
			default_tools?: {
				disabled?: string[];
			};
		};
		budgets?: {
			max_turns?: number;
			max_reflections?: number;
			max_seconds?: number;
		};
		spawn_policy?: {
			max_subagent_depth?: number;
			max_subagents_per_run?: number;
			max_spawns_per_turn?: number;
		};
		subagents?: {
			workspaceId: string;
		}[];
		hooks?: AgentHook[];
	};
};

/** The only hook kind with configurable fields today. */
export const PIXEL_HOOK_KIND = "pixel";

/** Resolves an attached MCP's name to its display name. */
export const getAgentMcpName = (mcp: AgentWorkspace["mcp"][number]) =>
	mcp.display_name || mcp.name;

/**
 * Host-provided link builders for an agent's attached resources. Each app
 * links to its own routes (or the platform's), so the shared agent views
 * take these instead of building URLs. Omit one for no link.
 */
export interface AgentLinks {
	/** Link for an attached knowledge source or toolbox. */
	getMcpUrl?: (mcp: Pick<MCPConfig, "id" | "type">) => string | undefined;
	/** Link for an attached skill. */
	getSkillUrl?: (skillId: string) => string | undefined;
	/** Link for an attached prompt. */
	getPromptUrl?: (promptId: string) => string | undefined;
	/** Link for a subagent. */
	getAgentUrl?: (agentId: string) => string | undefined;
}
