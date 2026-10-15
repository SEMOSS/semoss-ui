import { z } from "@semoss/ui/next";
import type { AgentConfiguration } from "../types/agent";

/** Catalog types a workspace resource can have, per `IEngine.CATALOG_TYPE`. */
const MCP_TYPES = [
	"PROJECT",
	"STORAGE",
	"DATABASE",
	"FUNCTION",
	"MODEL",
	"VECTOR",
	"GUARDRAIL",
	"ROOM",
] as const;

/** Editable knowledge and toolbox selections use the same resource types. */
export const mcpConfigSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	type: z.enum(MCP_TYPES),
});

/**
 * `GetWorkspace` builds each entry from an engine or project lookup, so `name`
 * is null when the alias cannot be resolved.
 */
const mcpEntrySchema = z.object({
	id: z.string(),
	name: z.string().nullish(),
	type: z.string(),
});

const promptEntrySchema = z.object({
	id: z.string(),
	type: z.string().nullish(),
	name: z.string().nullish(),
});

const skillEntrySchema = z.object({
	id: z.string(),
	type: z.string().nullish(),
	name: z.string().nullish(),
	slug: z.string().nullish(),
	description: z.string().nullish(),
});

const defaultToolSchema = z.object({
	name: z.string(),
	title: z.string().nullish(),
	description: z.string().nullish(),
});

/**
 * The raw `GetWorkspace` payload. Workspace reactors answer in snake_case,
 * unlike the agent-run reactors, which are camelCase.
 */
export const workspacePayloadSchema = z.object({
	workspace_id: z.string(),
	name: z.string(),
	description: z.string().nullish(),
	system_prompt: z.string().nullish(),
	owner: z.string().nullish(),
	is_active: z.boolean().nullish(),
	date_created: z.string().nullish(),
	date_updated: z.string().nullish(),
	mcp: z.array(mcpEntrySchema).nullish(),
	prompts: z.array(promptEntrySchema).nullish(),
	skills: z.array(skillEntrySchema).nullish(),
	permission: z.string().nullish(),
	number_collaborators: z.number().nullish(),
	// TODO:: GetWorkspace writes config_json twice - the raw DB string first, then
	// the parsed object - and it stays a string when parsing fails. Accept both
	// until the reactor is fixed to always return a map.
	config_json: z.unknown().optional(),
	default_tools: z.array(defaultToolSchema).nullish(),
	known_hook_kinds: z.array(z.string()).nullish(),
});

/** A validated `GetWorkspace` payload, before it is mapped to the client shape. */
export type WorkspacePayload = z.infer<typeof workspacePayloadSchema>;

/** A workspace as the client models it: the agent contract plus its id. */
export type WorkspaceAgent = AgentConfiguration & {
	workspace_id: string;
	permission?: string;
	number_collaborators?: number;
};

/**
 * Normalize `config_json`, which arrives either parsed or as a raw JSON string.
 * Returns undefined when absent or unparseable rather than throwing, so a bad
 * config blob degrades the agent's settings instead of failing the whole fetch.
 */
function parseConfigJson(value: unknown): AgentConfiguration["config_json"] {
	if (value === undefined || value === null) return undefined;

	if (typeof value === "string") {
		if (value.trim() === "") return undefined;
		try {
			const parsed: unknown = JSON.parse(value);
			return typeof parsed === "object" && parsed !== null
				? (parsed as AgentConfiguration["config_json"])
				: undefined;
		} catch {
			return undefined;
		}
	}

	return typeof value === "object"
		? (value as AgentConfiguration["config_json"])
		: undefined;
}

function isMcpType(
	value: string,
): value is AgentConfiguration["mcp"][number]["type"] {
	return (MCP_TYPES as readonly string[]).includes(value);
}

/** Map a validated `GetWorkspace` payload onto the client's agent contract. */
export function toWorkspaceAgent(payload: WorkspacePayload): WorkspaceAgent {
	return {
		workspace_id: payload.workspace_id,
		name: payload.name,
		description: payload.description ?? "",
		system_prompt: payload.system_prompt ?? "",
		mcp: (payload.mcp ?? [])
			.filter((entry) => isMcpType(entry.type.toUpperCase()))
			.map((entry) => ({
				id: entry.id,
				name: entry.name ?? entry.id,
				type: entry.type.toUpperCase() as AgentConfiguration["mcp"][number]["type"],
			})),
		skills: (payload.skills ?? []).map((entry) => ({
			id: entry.id,
			name: entry.name ?? entry.id,
		})),
		prompts: (payload.prompts ?? []).map((entry) => ({
			id: entry.id,
			name: entry.name ?? entry.id,
			type: entry.type ?? "PROMPT",
		})),
		known_hook_kinds: payload.known_hook_kinds ?? undefined,
		default_tools: (payload.default_tools ?? []).map((tool) => ({
			name: tool.name,
			title: tool.title ?? undefined,
			description: tool.description ?? undefined,
		})),
		config_json: parseConfigJson(payload.config_json),
		permission: payload.permission ?? undefined,
		number_collaborators: payload.number_collaborators ?? undefined,
	};
}

/**
 * A row from `MyProjects(projectType=["WORKSPACE"])`.
 */
const projectRowSchema = z.object({
	project_id: z.string(),
	project_name: z.string(),
	project_display_name: z.string().nullish(),
	project_description: z.string().nullish(),
	project_type: z.string().nullish(),
	project_date_created: z.string().nullish(),
	project_date_last_edited: z.string().nullish(),
	permission: z.union([z.string(), z.number()]).nullish(),
});

/** `MyProjects` answers with a bare array, not a paged envelope. */
export const projectListSchema = z.array(projectRowSchema);

/** One agent as it appears in a list, before `GetWorkspace` fills in the rest. */
export type ProjectRow = z.infer<typeof projectRowSchema>;
