import type { Agent as ShowcaseAgent } from "@/types/agent";
import { agentImageUrl } from "../api/agent-image";
import type { ProjectRow } from "../api/agent-schemas";

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
