import type { MCPConfig } from "../../../types";
import type { AgentWorkspace } from "../agent.types";
import type { AgentFormValues } from "./types";

/**
 * Maps `GetWorkspace`'s response shape to `AgentForm`'s flat field values.
 * MCP names are resolved to their display names here so every chip, row and
 * picker downstream matches the catalog (which already renders display names).
 */
export function toAgentFormValues(response: AgentWorkspace): AgentFormValues {
	const allMcps: MCPConfig[] = (response.mcp ?? []).map(
		({ display_name, ...m }) => ({ ...m, name: display_name || m.name }),
	);
	return {
		name: response.name ?? "",
		description: response.description ?? "",
		instructions: response.system_prompt ?? "",
		modelId: response.config_json?.model_id ?? "",
		useDefaultAgentTools:
			response.config_json?.use_default_agent_tools ?? true,
		greeting: response.config_json?.greeting ?? "",
		greetingEnabled: response.config_json?.greeting_enabled ?? false,
		disabledDefaultTools:
			response.config_json?.tool_policy?.default_tools?.disabled ?? [],
		maxTurns: response.config_json?.budgets?.max_turns?.toString() ?? "",
		maxReflections:
			response.config_json?.budgets?.max_reflections?.toString() ?? "",
		maxSeconds:
			response.config_json?.budgets?.max_seconds?.toString() ?? "",
		maxSubagentDepth:
			response.config_json?.spawn_policy?.max_subagent_depth?.toString() ??
			"",
		maxSubagentsPerRun:
			response.config_json?.spawn_policy?.max_subagents_per_run?.toString() ??
			"",
		maxSpawnsPerTurn:
			response.config_json?.spawn_policy?.max_spawns_per_turn?.toString() ??
			"",
		knowledge: allMcps.filter((m) => m.type === "VECTOR"),
		toolboxes: allMcps.filter((m) => m.type !== "VECTOR"),
		skills: response.skills ?? [],
		prompts: (response.prompts ?? []).map((p) => p.id),
		subagents: (response.config_json?.subagents ?? []).map((s) => ({
			workspaceId: s.workspaceId,
		})),
		hooks: response.config_json?.hooks ?? [],
	};
}

/** Prompt id to title, for rendering prompts the form only tracks by id. */
export function toAgentPromptTitles(
	response: AgentWorkspace,
): Record<string, string> {
	const titles: Record<string, string> = {};
	for (const p of response.prompts ?? []) {
		if (p.name) titles[p.id] = p.name;
	}
	return titles;
}
