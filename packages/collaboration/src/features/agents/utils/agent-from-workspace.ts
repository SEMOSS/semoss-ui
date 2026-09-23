import type { Agent as ShowcaseAgent } from "@/types/agent";
import { agentImageUrl } from "../api/agent-image";
import type { ProjectRow, WorkspaceAgent } from "../api/agent-schemas";

/**
 * Map a fetched workspace onto the showcase shape the screens render.
 *
 * This replaces the fixture-era `adaptShowcaseAgent`, which went the other way.
 *
 * @param agent - A workspace loaded via `GetWorkspace`.
 */
export function agentFromWorkspace(agent: WorkspaceAgent): ShowcaseAgent {
	const id = agent.workspace_id;
	const subagents = agent.config_json?.subagents ?? [];

	return {
		id,
		name: agent.name,
		description: agent.description,
		// The project image endpoint 404s when no image is set; AgentAvatar then
		// falls back to initials.
		avatar: agentImageUrl(id),
		instructions: agent.system_prompt,
		skills: agent.skills,
		mcp: agent.mcp.map(({ type, id, name }) => ({ type, id, name })),
		members: subagents.map((subagent) => subagent.workspaceId),
	};
}

/**
 * Map a `MyProjects` row onto the showcase shape, for list views rendered before
 * the full workspace is fetched.
 *
 * MyProjects carries no system prompt, skills, or resources, so those stay empty
 * until GetWorkspace loads for the selected agent.
 */
export function agentFromProjectRow(row: ProjectRow): ShowcaseAgent {
	const id = row.project_id;

	return {
		id,
		// project_name can be a namespace shared by many agents, such as "platform".
		name: row.project_display_name?.trim() || id,
		description: row.project_description?.trim() || "",
		avatar: agentImageUrl(id),
		instructions: "",
		skills: [],
		mcp: [],
		members: [],
	};
}
