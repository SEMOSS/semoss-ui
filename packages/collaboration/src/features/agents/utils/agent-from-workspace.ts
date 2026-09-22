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

function namesOfType(agent: WorkspaceAgent, type: string) {
	return agent.mcp
		.filter((entry) => entry.type === type)
		.map((entry) => entry.name);
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
	const config = agent.config_json;
	const subagents = config?.subagents ?? [];

	return {
		id,
		name: agent.name,
		role: agent.description,
		type: subagents.length > 0 ? "Team" : "Individual",
		// The project image endpoint 404s when no image is set, so AgentAvatar
		// falls back to the derived icon below.
		avatar: agentImageUrl(id),
		icon: agentIconFor(id),
		tone: agentToneFor(id),
		// TODO:: WorkspaceView (Conversation / Travel itinerary / Executive brief) is a
		// fixture-only concept with no server source. Everything real is a conversation.
		workspace: "Conversation",
		instructions: agent.system_prompt,
		skills: agent.skills.map((skill) => skill.name),
		databases: namesOfType(agent, "DATABASE"),
		// TODO:: "data products" is approximated by PROJECT-type resources. Confirm the
		// intended catalog type and narrow this.
		dataProducts: namesOfType(agent, "PROJECT"),
		members: subagents.map((subagent) => subagent.workspaceId),
		depth: config?.spawn_policy?.max_subagent_depth ?? 1,
		concurrency: config?.spawn_policy?.max_subagents_per_run ?? 1,
		spawn: subagents.length > 0,
		// TODO:: CONFIG_JSON hooks use kinds like git_commit / pixel / log_tools, which
		// do not map onto the UI's Email / Scheduled / Calendar / Webhook trigger
		// sources. Left empty until a trigger contract exists server-side.
		triggers: [],
	};
}

/**
 * Map a `MyProjects` row onto the showcase shape, for list views rendered before
 * the full workspace is fetched.
 *
 * TODO:: MyProjects carries no description, system prompt, skills or resources,
 * so those stay empty until GetWorkspace loads for the selected agent.
 */
export function agentFromProjectRow(row: ProjectRow): ShowcaseAgent {
	const id = row.project_id;

	return {
		id,
		name: row.project_name,
		role: "",
		type: "Individual",
		avatar: agentImageUrl(id),
		icon: agentIconFor(id),
		tone: agentToneFor(id),
		workspace: "Conversation",
		instructions: "",
		skills: [],
		databases: [],
		dataProducts: [],
		members: [],
		depth: 1,
		concurrency: 1,
		spawn: false,
		triggers: [],
	};
}
