/**
 * An agent's full configuration, exactly as `GetWorkspace` returns it.
 *
 * An agent IS a workspace server-side, so this mirrors that payload — snake_case
 * field names and all — rather than restating it in client vocabulary. The
 * showcase shape the screens render is derived from this by
 * `agent-from-workspace.ts`.
 */
export interface Agent {
	name: string;
	description: string;
	system_prompt: string;
	mcp: {
		type:
			| "PROJECT"
			| "STORAGE"
			| "DATABASE"
			| "FUNCTION"
			| "MODEL"
			| "VECTOR"
			| "GUARDRAIL"
			| "ROOM";
		id: string;
		name: string;
		subtype?: string;
		description?: string;
		// TODO:: GetWorkspace returns only {id, name, type} per mcp entry, so tags and
		// permission have no server source. Extend the reactor to return per-resource
		// tags and the caller's permission, then make these required again.
		tags?: string[];
		permission?: "READ_ONLY" | "EDIT" | "OWNER";
	}[];
	skills: {
		id: string;
		name: string;
	}[];
	prompts: { id: string; name: string; type: string }[];
	known_hook_kinds?: string[];
	default_tools?: {
		name: string;
		title?: string;
		description?: string;
	}[];
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
		hooks?: {
			kind: string;
			pixel?: string;
			events?: string[];
		}[];
	};
}
