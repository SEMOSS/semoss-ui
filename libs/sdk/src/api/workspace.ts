import { runPixel } from "./base";
import { throwOnPixelErrors } from "./playground-room";

// -------------------------------------------------------------------------------------------------
// Agents, which the backend calls workspaces (GetWorkspace, AddWorkspace, EditWorkspace,
// DeleteWorkspace, GetWorkspaceRooms). Each runs in the insight it is given, normally the
// session's (`Session.insight.withInsight`). The backend answers in snake_case.
// -------------------------------------------------------------------------------------------------

/** What kind of engine or project a tool or knowledge source of an agent is. */
export type WorkspaceToolType =
	| "PROJECT"
	| "STORAGE"
	| "DATABASE"
	| "FUNCTION"
	| "MODEL"
	| "VECTOR"
	| "GUARDRAIL"
	| "ROOM";

/** A tool or knowledge source an agent brings, as `GetWorkspace` lists it. */
export interface WorkspaceTool {
	/** The engine or project's id; the only field the backend reads back. */
	id: string;
	/** Its canonical catalog name. */
	name: string;
	/** What kind of engine or project it is. */
	type: WorkspaceToolType;
	/** The name to show, when it differs from `name`. */
	display_name?: string;
	/** Its description. */
	description?: string;
}

/** A skill an agent brings, with its frontmatter description. */
export interface WorkspaceSkill {
	/** The skill's project id. */
	id: string;
	/** Its display name. */
	name: string;
	/** Its frontmatter description. */
	description?: string;
}

/** A prompt an agent suggests. */
export interface WorkspacePrompt {
	/** The prompt's id. */
	id: string;
	/** Its title. */
	name: string;
	/** Its resource type. */
	type: string;
}

/** One `CONFIG_JSON.hooks` entry. `pixel` and `events` only apply to the `pixel` kind. */
export interface WorkspaceHook {
	/** The hook's kind, one of `GetWorkspace`'s `known_hook_kinds`. */
	kind: string;
	/** The pixel a `pixel` hook runs. */
	pixel?: string;
	/** The lifecycle events a `pixel` hook runs on; all of them when left out. */
	events?: string[];
}

/** One entry of the deployment's built-in agent tool catalog. */
export interface WorkspaceDefaultTool {
	/** The tool's name. */
	name: string;
	/** Its title. */
	title?: string;
	/** Its description. */
	description?: string;
}

/** The settings the agent editor saves on an agent (`CONFIG_JSON`). */
export interface WorkspaceConfig {
	/** The agent's default model. Empty means the room's own model is used. */
	model_id?: string;
	/** Whether the agent's runs bring the built-in agent tools. */
	use_default_agent_tools?: boolean;
	/** The agent's scripted opening message, shown when `greeting_enabled`. */
	greeting?: string;
	/** Whether `greeting` is shown. */
	greeting_enabled?: boolean;
	/** Which built-in agent tools are switched off. */
	tool_policy?: { default_tools?: { disabled?: string[] } };
	/** The run's limits. */
	budgets?: {
		max_turns?: number;
		max_reflections?: number;
		max_seconds?: number;
	};
	/** How far a run may spawn subagents. */
	spawn_policy?: {
		max_subagent_depth?: number;
		max_subagents_per_run?: number;
		max_spawns_per_turn?: number;
	};
	/** The agents this one may run as subagents. */
	subagents?: { workspaceId: string }[];
	/** The agent's lifecycle hooks. */
	hooks?: WorkspaceHook[];
}

/** An agent's full configuration, as `GetWorkspace` returns it. */
export interface WorkspaceDetails {
	/** The agent's id. */
	workspace_id: string;
	/** The agent's name. */
	name: string;
	/** The catalog name to show, when it differs from `name`. */
	display_name?: string;
	/** The agent's description. */
	description: string;
	/** The agent's instructions. Line breaks arrive escaped (`\\n`). */
	system_prompt: string;
	/** When the agent was created. */
	date_created?: string;
	/** The user's permission on the agent. */
	permission?: string;
	/** The tools and knowledge the agent brings to every room it runs in. */
	mcp: WorkspaceTool[];
	/** The skills the agent brings. */
	skills: WorkspaceSkill[];
	/** The prompts the agent suggests. */
	prompts: WorkspacePrompt[];
	/** The hook kinds the server recognizes. */
	known_hook_kinds?: string[];
	/** The deployment's built-in agent tool catalog. */
	default_tools?: WorkspaceDefaultTool[];
	/** The settings the agent editor saved. */
	config_json?: WorkspaceConfig;
}

/** A tool or knowledge source sent to AddWorkspace or EditWorkspace; extra fields are sent as given. */
export interface WorkspaceToolRef {
	/** The engine or project's id. */
	id: string;
	/** Its name. */
	name: string;
	/** What kind it is. */
	type: string;
}

/** What AddWorkspace takes: an agent's basics. */
export interface AddWorkspaceParams {
	/** The agent's name. */
	name: string;
	/** Its description. */
	description: string;
	/** Its instructions. */
	systemPrompt: string;
	/** The tools and knowledge it brings. */
	mcp: readonly WorkspaceToolRef[];
	/** The ids of the skills it brings. */
	skills: readonly string[];
	/** The ids of the prompts it suggests. */
	prompts: readonly string[];
}

/**
 * What EditWorkspace takes: an agent's whole configuration. Every field is sent, since
 * EditWorkspace treats an omitted list as empty. The limits are strings, blank for unset.
 */
export interface EditWorkspaceParams extends AddWorkspaceParams {
	/** The agent's default model, or empty for none. */
	modelId: string;
	/** Whether its runs bring the built-in agent tools. */
	useDefaultAgentTools: boolean;
	/** The built-in agent tools switched off. */
	disabledDefaultTools: readonly string[];
	/** The most model turns a run takes. */
	maxTurns: string;
	/** The most reflections a run takes. */
	maxReflections: string;
	/** The longest a run takes, in seconds. */
	maxSeconds: string;
	/** How deep subagents may nest. */
	maxSubagentDepth: string;
	/** The most subagents one run starts. */
	maxSubagentsPerRun: string;
	/** The most subagents one turn starts. */
	maxSpawnsPerTurn: string;
	/** The agents this one may run as subagents. */
	subagents: readonly { workspaceId: string }[];
	/** Its lifecycle hooks. */
	hooks: readonly WorkspaceHook[];
	/** Its scripted opening message. */
	greeting: string;
	/** Whether the opening message is shown. */
	greetingEnabled: boolean;
}

/** A room started from an agent, as `GetWorkspaceRooms` lists it. */
export interface WorkspaceRoom {
	/** The room's id. */
	room_id: string;
	/** The room's name. */
	room_name: string;
	/** When the room last changed. */
	date_updated: string;
}

/** One page of an agent's rooms. */
export interface WorkspaceRoomsPage {
	/** How many rooms match, over every page. */
	total_count: number;
	/** This page's rooms. */
	rooms: WorkspaceRoom[];
}

/** Which of an agent's rooms to read. */
export interface WorkspaceRoomsQuery {
	/** The agent. */
	workspaceId: string;
	/** Only rooms whose name contains this, when set. */
	search?: string;
	/** How many rooms to read. */
	limit: number;
	/** How many rooms to skip. */
	offset: number;
}

/**
 * Read the settings `GetWorkspace` returns, which arrive parsed or, when the reactor could
 * not parse them, as the raw JSON string.
 *
 * @param value - The `config_json` field.
 * @returns The settings, or undefined when there are none or they cannot be read.
 */
const readWorkspaceConfig = (value: unknown): WorkspaceConfig | undefined => {
	if (typeof value === "string") {
		try {
			return readWorkspaceConfig(JSON.parse(value));
		} catch {
			return undefined;
		}
	}
	return typeof value === "object" && value !== null
		? (value as WorkspaceConfig)
		: undefined;
};

/**
 * Read an agent's full configuration.
 *
 * @param insightId - The insight to run in.
 * @param workspaceId - The agent.
 * @returns The agent, with its lists never missing and its settings parsed.
 * @throws When the backend reports an error or returns no agent.
 */
export const getWorkspace = async (
	insightId: string,
	workspaceId: string,
): Promise<WorkspaceDetails> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[WorkspaceDetails | null]>(
			`GetWorkspace(workspaceId=${JSON.stringify([workspaceId])});`,
			insightId,
		),
	);
	const output = pixelReturn[0]?.output;
	if (typeof output !== "object" || output === null) {
		throw new Error(`No agent ${workspaceId}`);
	}
	return {
		...output,
		mcp: output.mcp ?? [],
		skills: output.skills ?? [],
		prompts: output.prompts ?? [],
		config_json: readWorkspaceConfig(output.config_json),
	};
};

/**
 * Build the AddWorkspace pixel for an agent's basics. AddWorkspace takes nothing else; follow
 * it with {@link editWorkspace} to save the rest.
 *
 * @param params - The agent's basics.
 * @returns The pixel.
 */
export const addWorkspacePixel = (params: AddWorkspaceParams): string =>
	`AddWorkspace(name=${JSON.stringify(params.name)}, description=${JSON.stringify(params.description)}, systemPrompt=${JSON.stringify(params.systemPrompt)}, mcp=${JSON.stringify(params.mcp)}, skills=${JSON.stringify(params.skills)}, prompts=${JSON.stringify(params.prompts)});`;

/**
 * Build the EditWorkspace pixel that saves an agent's whole configuration.
 *
 * @param workspaceId - The agent.
 * @param params - Its whole configuration.
 * @returns The pixel.
 */
export const editWorkspacePixel = (
	workspaceId: string,
	params: EditWorkspaceParams,
): string =>
	`EditWorkspace(workspaceId=["${workspaceId}"], name=${JSON.stringify(params.name)}, description=${JSON.stringify(params.description)}, systemPrompt=${JSON.stringify(params.systemPrompt)}, mcp=${JSON.stringify(params.mcp)}, skills=${JSON.stringify(params.skills)}, prompts=${JSON.stringify(params.prompts)}, modelId=${JSON.stringify(params.modelId)}, useDefaultAgentTools=${JSON.stringify(params.useDefaultAgentTools)}, disabledDefaultTools=${JSON.stringify(params.disabledDefaultTools)}, maxTurns=${JSON.stringify(params.maxTurns)}, maxReflections=${JSON.stringify(params.maxReflections)}, maxSeconds=${JSON.stringify(params.maxSeconds)}, maxSubagentDepth=${JSON.stringify(params.maxSubagentDepth)}, maxSubagentsPerRun=${JSON.stringify(params.maxSubagentsPerRun)}, maxSpawnsPerTurn=${JSON.stringify(params.maxSpawnsPerTurn)}, subagents=${JSON.stringify(params.subagents)}, hooks=${JSON.stringify(params.hooks)}, greeting=${JSON.stringify(params.greeting)}, greetingEnabled=${JSON.stringify(params.greetingEnabled)});`;

/**
 * Read the partial-save warning EditWorkspace puts beside its output, when some of the
 * configuration was saved and some was not.
 *
 * @param output - EditWorkspace's output.
 * @returns The warning, when there is one.
 */
export const readWorkspaceSaveWarning = (
	output: unknown,
): string | undefined => {
	if (
		typeof output !== "object" ||
		output === null ||
		!("warning" in output)
	) {
		return undefined;
	}
	const warning = output.warning;
	return typeof warning === "string" ? warning : undefined;
};

/**
 * Create an agent from its basics.
 *
 * @param insightId - The insight to run in.
 * @param params - The agent's basics.
 * @returns The new agent's id.
 * @throws When the backend reports an error or returns no id.
 */
export const addWorkspace = async (
	insightId: string,
	params: AddWorkspaceParams,
): Promise<string> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[string]>(addWorkspacePixel(params), insightId),
	);
	const workspaceId = pixelReturn[0]?.output;
	if (!workspaceId) {
		throw new Error("AddWorkspace returned no agent id");
	}
	return workspaceId;
};

/**
 * Save an agent's whole configuration.
 *
 * @param insightId - The insight to run in.
 * @param workspaceId - The agent.
 * @param params - Its whole configuration.
 * @returns The partial-save warning, when only some of it was saved.
 * @throws When the backend reports an error or returns nothing.
 */
export const editWorkspace = async (
	insightId: string,
	workspaceId: string,
	params: EditWorkspaceParams,
): Promise<string | undefined> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[unknown]>(
			editWorkspacePixel(workspaceId, params),
			insightId,
		),
	);
	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error("EditWorkspace returned nothing");
	}
	return readWorkspaceSaveWarning(output);
};

/**
 * Delete an agent.
 *
 * @param insightId - The insight to run in.
 * @param workspaceId - The agent.
 * @throws When the backend reports an error.
 */
export const deleteWorkspace = async (
	insightId: string,
	workspaceId: string,
): Promise<void> => {
	throwOnPixelErrors(
		await runPixel<[boolean]>(
			`DeleteWorkspace(workspaceId=['${workspaceId}'])`,
			insightId,
		),
	);
};

/**
 * Build the GetWorkspaceRooms pixel for one page of an agent's rooms, for a hook that pages
 * (`useSessionIteratorPixel`).
 *
 * @param query - The agent, the search, and the page.
 * @returns The pixel.
 */
export const getWorkspaceRoomsPixel = ({
	workspaceId,
	search,
	limit,
	offset,
}: WorkspaceRoomsQuery): string =>
	`GetWorkspaceRooms(workspaceId=["${workspaceId}"], ${search ? `filters=[Filter(ROOM__ROOM_NAME ?like "<encode>${search}</encode>")],` : ""} limit=[${limit}], offset=[${offset}]);`;

/**
 * Read one page of the rooms started from an agent.
 *
 * @param insightId - The insight to run in.
 * @param query - The agent, the search, and the page.
 * @returns The page, and how many rooms match over every page.
 * @throws When the backend reports an error.
 */
export const getWorkspaceRooms = async (
	insightId: string,
	query: WorkspaceRoomsQuery,
): Promise<WorkspaceRoomsPage> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[WorkspaceRoomsPage]>(
			getWorkspaceRoomsPixel(query),
			insightId,
		),
	);
	const output = pixelReturn[0]?.output;
	return {
		total_count: output?.total_count ?? 0,
		rooms: output?.rooms ?? [],
	};
};
