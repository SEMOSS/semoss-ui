import type { MCPConfig, SkillConfig } from "../../types";

/** One CONFIG_JSON.hooks[] entry. `pixel`/`events` only apply to the `pixel` kind. */
export type AgentHook = {
	kind: string;
	pixel?: string;
	events?: string[];
};

/** One entry of a deployment's built-in agent tool catalog. */
export type AgentDefaultTool = {
	name: string;
	title?: string;
	description?: string;
};

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

/**
 * Lifecycle event names `PixelReactorHook` filters on. Not returned by any
 * API (only `known_hook_kinds` is) since this is specific to the `pixel`
 * kind - mirrors `PixelReactorHook.KNOWN_EVENTS` in Semoss.
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
