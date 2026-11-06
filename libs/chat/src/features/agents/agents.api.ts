import { runSessionPixel } from "@semoss/sdk";
import {
	type AgentFormValues,
	agentNeedsFollowUpEdit,
	buildAddWorkspacePixel,
	buildEditWorkspacePixel,
	getWorkspaceSaveWarning,
} from "@semoss/shared";
import type { MCPConfig, Workspace } from "../../types";

/**
 * Add an agent (workspace) with its basics, as the room's Publish as Agent
 * dialog saves one.
 *
 * @param data - The agent's name, instructions, tools, skills and prompts.
 * @returns The new agent's id.
 */
export const addWorkspace = async (
	data: Pick<
		Workspace,
		"name" | "system_prompt" | "description" | "mcp" | "skills" | "prompts"
	>,
): Promise<string> => {
	const mcp = data.mcp.map(
		({ name, id, type }): MCPConfig => ({ name, id, type }),
	);
	const skills = data.skills.map((s) => s.id);

	const pixel = `AddWorkspace(name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)})`;
	const { pixelReturn } = await runSessionPixel<[string]>(pixel);

	return pixelReturn[0].output;
};

/**
 * Save an agent's full configuration from the shared agent form.
 *
 * @param workspaceId - The agent.
 * @param values - The form's values.
 * @returns EditWorkspace's partial-save warning, when there is one.
 * @throws When the save returned nothing.
 */
export const editWorkspace = async (
	workspaceId: string,
	values: AgentFormValues,
): Promise<string | undefined> => {
	const { pixelReturn } = await runSessionPixel<[unknown]>(
		buildEditWorkspacePixel(workspaceId, values),
	);
	const output = pixelReturn[0]?.output;
	if (!output) {
		throw new Error();
	}
	return getWorkspaceSaveWarning(output);
};

/**
 * Create an agent from the shared agent form. AddWorkspace only takes the
 * basics, so everything else is saved with a follow-up EditWorkspace when the
 * form sets any of it.
 *
 * @param values - The form's values.
 * @returns The new agent's id, EditWorkspace's partial-save warning (when
 * there is one), and whether the follow-up save failed — the agent exists
 * either way.
 * @throws When the agent could not be created.
 */
export const createAgent = async (
	values: AgentFormValues,
): Promise<{
	workspaceId: string;
	warning?: string;
	settingsFailed?: boolean;
}> => {
	const { pixelReturn } = await runSessionPixel<[string]>(
		buildAddWorkspacePixel(values),
	);
	const workspaceId = pixelReturn[0]?.output;
	if (!workspaceId) {
		throw new Error();
	}
	if (!agentNeedsFollowUpEdit(values)) {
		return { workspaceId };
	}
	try {
		const warning = await editWorkspace(workspaceId, values);
		return { workspaceId, warning };
	} catch (e) {
		console.error(e);
		return { workspaceId, settingsFailed: true };
	}
};

/**
 * Delete an agent. A failure is logged, not thrown, as the catalog expects.
 *
 * @param workspaceId - The agent.
 */
export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
	try {
		await runSessionPixel(
			`DeleteWorkspace(workspaceId=['${workspaceId}'])`,
		);
	} catch (e) {
		console.error(e);
	}
};
