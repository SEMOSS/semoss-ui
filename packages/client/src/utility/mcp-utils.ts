import {
	type AgentLinks,
	createMcpPlatformUrl,
	createPromptPlatformUrl,
} from "@semoss/shared";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL ?? "";

export const mcpToPlatformUrl = createMcpPlatformUrl(PLATFORM_URL);
export const promptToPlatformUrl = createPromptPlatformUrl(PLATFORM_URL);
export const skillToPlatformUrl = (skill: { id: string }): string =>
	`${PLATFORM_URL}/#/skill/${skill.id}/view`;
export const agentToPlatformUrl = (agent: { id: string }): string =>
	`${PLATFORM_URL}/#/agent/${agent.id}`;

/** The client's links for an agent's attached resources, used by the shared agent views. */
export const CLIENT_AGENT_LINKS: AgentLinks = {
	getMcpUrl: mcpToPlatformUrl,
	getSkillUrl: (id) => skillToPlatformUrl({ id }),
	getPromptUrl: (id) => promptToPlatformUrl({ id }),
	getAgentUrl: (id) => agentToPlatformUrl({ id }),
};
