import { usePixel } from "@semoss/sdk/react";
import type { MCPConfig, SkillConfig } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import {
	type AgentDefaultTool,
	AgentForm,
	type AgentFormValues,
} from "@/components/agent-workspace/agent-form";
import { useProject } from "@/hooks";

type GetWorkspaceResponse = {
	name: string;
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	skills: SkillConfig[];
	prompts: { id: string; name: string; type: string }[];
	known_hook_kinds?: string[];
	default_tools?: AgentDefaultTool[];
	config_json?: {
		model_id?: string;
		use_default_agent_tools?: boolean;
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
		hooks?: {
			kind: string;
			pixel?: string;
			events?: string[];
		}[];
	};
};

/** Maps `GetWorkspace`'s response shape to `AgentForm`'s flat field values. */
function toFormValues(response: GetWorkspaceResponse): AgentFormValues {
	const allMcps = response.mcp ?? [];
	return {
		name: response.name ?? "",
		description: response.description ?? "",
		instructions: response.system_prompt ?? "",
		modelId: response.config_json?.model_id ?? "",
		useDefaultAgentTools:
			response.config_json?.use_default_agent_tools ?? true,
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

const noop = () => {};

/**
 * Read-only view of a WORKSPACE project's agent configuration - every field
 * is disabled and there is no Save.
 */
export const AgentViewer = () => {
	const { project } = useProject();
	const { data, status } = usePixel<GetWorkspaceResponse>(
		`GetWorkspace(workspaceId=["${project.project_id}"]);`,
	);

	if (status !== "SUCCESS") {
		return (
			<div className="flex h-full w-full items-center justify-center bg-background">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			<div className="flex-1 overflow-y-auto">
				<AgentForm
					data={toFormValues(data)}
					onChange={noop}
					readOnly
					knownHookKinds={data.known_hook_kinds ?? []}
					defaultTools={data.default_tools ?? []}
				/>
			</div>
		</div>
	);
};
