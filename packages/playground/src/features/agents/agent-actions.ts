import { addWorkspace, deleteWorkspace, editWorkspace } from "@semoss/sdk";
import { Session } from "@semoss/sdk/react";
import {
	type AgentFormValues,
	agentNeedsFollowUpEdit,
	toAddWorkspaceParams,
	toEditWorkspaceParams,
} from "@semoss/shared";

/**
 * Save an agent's full configuration from the shared agent form, in the
 * session's insight.
 *
 * @param workspaceId - The agent to save.
 * @param values - The agent form's values.
 * @returns EditWorkspace's partial-save warning, when there is one.
 * @throws When the pixel fails or returns nothing.
 */
export const editAgent = (
	workspaceId: string,
	values: AgentFormValues,
): Promise<string | undefined> =>
	Session.insight.withInsight((insightId) =>
		editWorkspace(insightId, workspaceId, toEditWorkspaceParams(values)),
	);

/**
 * Create an agent from the shared agent form. AddWorkspace only takes the
 * basics, so everything else is saved with a follow-up EditWorkspace when the
 * form sets any of it.
 *
 * Resolves with the new agent's id, EditWorkspace's partial-save warning
 * (when there is one), and whether the follow-up save failed - the agent
 * exists either way.
 *
 * @param values - The agent form's values.
 * @returns The agent's id, and how its follow-up save went.
 * @throws When AddWorkspace fails or returns no id.
 */
export const createAgent = async (
	values: AgentFormValues,
): Promise<{
	workspaceId: string;
	warning?: string;
	settingsFailed?: boolean;
}> => {
	const workspaceId = await Session.insight.withInsight((insightId) =>
		addWorkspace(insightId, toAddWorkspaceParams(values)),
	);
	if (!agentNeedsFollowUpEdit(values)) {
		return { workspaceId };
	}
	try {
		const warning = await editAgent(workspaceId, values);
		return { workspaceId, warning };
	} catch (e) {
		console.error(e);
		return { workspaceId, settingsFailed: true };
	}
};

/**
 * Delete an agent, in the session's insight.
 *
 * @param workspaceId - The agent to delete.
 * @throws What the backend reports, so the caller can say the delete failed.
 */
export const deleteAgent = async (workspaceId: string): Promise<void> => {
	// a failure reaches the caller, whose page reports it and stays put
	await Session.insight.withInsight((insightId) =>
		deleteWorkspace(insightId, workspaceId),
	);
};
