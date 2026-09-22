import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, PixelError, pixel } from "@/lib/pixel";
import { getAgent } from "./get-agent";

/**
 * The fields an agent form can change.
 *
 * Everything but `name` is optional: on an update, an omitted field keeps its
 * current value rather than clearing it — see {@link updateAgent} for why that
 * needs care.
 */
export interface AgentDraft {
	/** Display name. Required by both reactors, even when unchanged. */
	name: string;
	/** Short summary shown in list views. */
	description?: string;
	/** The agent's system prompt. */
	systemPrompt?: string;
	/** Whether the platform's default tools are available to the agent. */
	useDefaultAgentTools?: boolean;
	/** Cap on model round-trips per run. */
	maxTurns?: number;
	/** Cap on self-reflection turns per run. */
	maxReflections?: number;
	/** How deep this agent may spawn subagents. */
	maxSubagentDepth?: number;
	/** Total subagents it may spawn across one run, including nested helpers. */
	maxSubagentsPerRun?: number;
	/** Skill ids the agent should end up with. Omit to keep the current set. */
	skillIds?: string[];
	/** Workspace ids of the agents available for delegation. An empty list clears them. */
	subagents?: { workspaceId: string }[];
}

// AddWorkspace returns the workspace id as a MESSAGE string.
const newWorkspaceIdSchema = z.string().trim().min(1);

// EditWorkspace answers `true` on success, but a MAP describing what failed when
// only part of the update applied.
const editResultSchema = z.union([
	z.boolean(),
	z.object({ success: z.literal(true), warning: z.string() }),
]);

/** A created workspace whose follow-up settings still need to be saved. */
export class AgentCreatedError extends Error {
	/** Retained so retry updates this workspace instead of creating another one. */
	readonly workspaceId: string;

	constructor(workspaceId: string, cause: unknown) {
		super(
			`The agent was created, but its settings could not be saved. Retry saving to finish configuring this agent. ${cause instanceof Error ? cause.message : String(cause)}`,
			{ cause },
		);
		this.name = "AgentCreatedError";
		this.workspaceId = workspaceId;
	}
}

/**
 * Create an agent, then save settings only accepted by EditWorkspace.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param draft - The agent's initial configuration.
 * @returns The new workspace id.
 */
export async function createAgent(
	actions: InsightActions,
	draft: AgentDraft,
): Promise<string> {
	const workspaceId = await callPixel(
		actions,
		pixel("AddWorkspace", {
			name: draft.name,
			description: draft.description,
			systemPrompt: draft.systemPrompt,
			skills: draft.skillIds,
			useDefaultAgentTools: draft.useDefaultAgentTools,
		}),
		newWorkspaceIdSchema,
	);

	const hasExecutionSettings =
		draft.maxTurns !== undefined ||
		draft.maxReflections !== undefined ||
		draft.maxSubagentDepth !== undefined ||
		draft.maxSubagentsPerRun !== undefined ||
		draft.subagents !== undefined;
	if (hasExecutionSettings) {
		try {
			// Reload and resend resources because EditWorkspace replaces them.
			await updateAgent(actions, workspaceId, draft);
		} catch (cause) {
			throw new AgentCreatedError(workspaceId, cause);
		}
	}

	return workspaceId;
}

/**
 * Update an existing agent.
 *
 * `EditWorkspace` is **not** a partial update for the fields it touches. Its
 * `updateWorkspaceEntry` runs an unconditional
 * `UPDATE WORKSPACE SET NAME = ?, DESCRIPTION = ?, SYSTEM_PROMPT = ?` and then
 * `DELETE FROM WORKSPACE_RESOURCE WHERE WORKSPACE_ID = ?` before re-inserting
 * only the resources this call passed. Omitting a field therefore blanks it, and
 * omitting `mcp` / `skills` / `prompts` deletes every attached resource.
 *
 * So the current record is loaded first and re-sent in full; the draft only
 * overrides what the caller actually changed.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param workspaceId - The agent to update.
 * @param draft - Fields to apply. Anything omitted keeps its current value.
 * @throws {PixelError} when the server reports a partial update.
 */
export async function updateAgent(
	actions: InsightActions,
	workspaceId: string,
	draft: AgentDraft,
): Promise<void> {
	const current = await getAgent(actions, workspaceId);

	const statement = pixel("EditWorkspace", {
		workspaceId,
		name: draft.name || current.name,
		description: draft.description ?? current.description,
		systemPrompt: draft.systemPrompt ?? current.system_prompt,
		// Re-sent in full because the reactor deletes and re-inserts resources.
		mcp: current.mcp.map((entry) => ({ type: entry.type, id: entry.id })),
		skills: draft.skillIds ?? current.skills.map((skill) => skill.id),
		prompts: current.prompts.map((prompt) => prompt.id),
		useDefaultAgentTools: draft.useDefaultAgentTools,
		maxTurns: draft.maxTurns,
		maxReflections: draft.maxReflections,
		maxSubagentDepth: draft.maxSubagentDepth,
		maxSubagentsPerRun: draft.maxSubagentsPerRun,
		subagents: draft.subagents,
	});

	const result = await callPixel(actions, statement, editResultSchema);

	if (result !== true) {
		throw new PixelError(
			result === false
				? "SEMOSS did not confirm the agent settings were saved."
				: result.warning,
			statement,
		);
	}
}
