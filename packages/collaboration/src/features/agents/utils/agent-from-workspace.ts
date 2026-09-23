import type {
	AgentIcon,
	AgentTone,
	Agent as ShowcaseAgent,
} from "@/types/agent";
import { agentImageUrl } from "../api/agent-image";
import type { ProjectRow, WorkspaceAgent } from "../api/agent-schemas";

const ICONS: AgentIcon[] = ["compass", "briefcase", "chart", "pen", "users"];
const TONES: AgentTone[] = ["green", "teal", "blue", "amber"];

/** Stable non-cryptographic hash, so an agent keeps the same look across reloads. */
function hashId(id: string) {
	let hash = 0;
	for (let index = 0; index < id.length; index += 1) {
		hash = (hash * 31 + id.charCodeAt(index)) | 0;
	}
	return Math.abs(hash);
}

// TODO:: icon and tone have no server source. They are derived from the
// workspace id so they stay stable per agent. Persist a real choice in
// CONFIG_JSON and read it here instead.
function agentIconFor(id: string): AgentIcon {
	return ICONS[hashId(id) % ICONS.length];
}

/** The colour that pairs with {@link agentIconFor}, derived the same way. */
function agentToneFor(id: string): AgentTone {
	return TONES[hashId(id) % TONES.length];
}

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
		// The project image endpoint 404s when no image is set, so AgentAvatar
		// falls back to the derived icon below.
		avatar: agentImageUrl(id),
		icon: agentIconFor(id),
		tone: agentToneFor(id),
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
		icon: agentIconFor(id),
		tone: agentToneFor(id),
		instructions: "",
		skills: [],
		mcp: [],
		members: [],
	};
}
