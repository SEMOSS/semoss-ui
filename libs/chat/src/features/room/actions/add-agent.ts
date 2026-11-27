import { addWorkspace } from "@semoss/sdk";
import { Session } from "@semoss/sdk/react";
import type { MCPConfig, Workspace } from "../../../types";

/**
 * Create an agent from its basics with AddWorkspace, in the session's
 * insight: what Publish as Agent does from a room. Creating one from the
 * full agent form, saving and deleting belong to the host with agent pages.
 *
 * @param data - The agent's name, prompt, description, tools, skills, and
 * prompts.
 * @returns The new agent's id.
 * @throws When the pixel fails or returns no id.
 */
export const addAgent = (
	data: Pick<
		Workspace,
		"name" | "system_prompt" | "description" | "mcp" | "skills" | "prompts"
	>,
): Promise<string> =>
	Session.insight.withInsight((insightId) =>
		addWorkspace(insightId, {
			name: data.name,
			description: data.description,
			systemPrompt: data.system_prompt,
			mcp: data.mcp.map(
				({ name, id, type }): MCPConfig => ({ name, id, type }),
			),
			skills: data.skills.map((s) => s.id),
			prompts: data.prompts,
		}),
	);
