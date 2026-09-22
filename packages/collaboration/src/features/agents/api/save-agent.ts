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
	/** How many subagents it may run at once. */
	maxSubagentsPerRun?: number;
	/** Skill ids the agent should end up with. Omit to keep the current set. */
	skillIds?: string[];
}

// TODO:: AddWorkspace returns the new workspaceId as the success MESSAGE string
// rather than a map, so it cannot be validated structurally. Change the reactor
// to return a MAP of {workspace_id} and narrow this.
const newWorkspaceIdSchema = z.string().min(1);

// EditWorkspace answers `true` on success, but a MAP describing what failed when
// only part of the update applied.
const editResultSchema = z.union([
	z.boolean(),
	z.record(z.string(), z.unknown()),
]);

/**
 * Create an agent.
 *
 * @param actions - `actions` from `useInsight()`.
 * @param draft - The agent's initial configuration.
 * @returns The new workspace id.
 */
export async function createAgent(
	actions: InsightActions,
	draft: AgentDraft,
): Promise<string> {
	return callPixel(
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
	});

	const result = await callPixel(actions, statement, editResultSchema);

	// TODO:: EditWorkspace reports partial failure as a MAP instead of an error, so
	// the detail is surfaced here rather than per field. Map these onto the
	// individual form fields once the reactor's shape is documented.
	if (result !== true) {
		throw new PixelError(
			`The agent was only partially updated: ${JSON.stringify(result)}`,
			statement,
		);
	}
}
