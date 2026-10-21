import {
	type AgentLinks,
	createMcpPlatformUrl,
	createPromptPlatformUrl,
} from "@semoss/shared";

/**
 * These links open the client's own pages, so they are relative to the page
 * they are on and keep whatever path the client is served under, such as a
 * deployment's context path in front of /SemossWeb.
 */
const PLATFORM_URL = ".";

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
