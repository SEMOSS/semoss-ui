import {
	type AgentLinks,
	createMcpPlatformUrl,
	createPromptPlatformUrl,
	type MCPConfig,
} from "@semoss/shared";

export { isKnowledgeMcp, splitMcpByType } from "@semoss/shared";

/**
 * Whether the user can take a selection out of a room in Settings: one they
 * added, not one the room's agent brings or the room's own toolbox.
 *
 * @param item - A toolbox or knowledge selection in the room's options.
 * @return Whether it can be removed.
 */
export const isRemovableToolbox = (
	item: Pick<MCPConfig, "fromWorkspace" | "fromRoom" | "type">,
): boolean => !item.fromWorkspace && !item.fromRoom && item.type !== "ROOM";

/**
 * The links for an agent's attached resources, used by the shared agent
 * views. Catalog links point at the platform and only appear when platform
 * links are on and the host knows the platform; subagents link to the
 * host's own agent page.
 *
 * @param options.platformUrl - The platform's address, if the host has one.
 * @param options.showPlatformLinks - Whether platform links are on.
 * @param options.getAgentHref - The host's address for an agent.
 * @return The links.
 */
export const getAgentLinks = ({
	platformUrl,
	showPlatformLinks,
	getAgentHref,
}: {
	platformUrl?: string;
	showPlatformLinks?: boolean;
	getAgentHref: (agentId: string) => string;
}): AgentLinks => {
	if (!showPlatformLinks || platformUrl === undefined) {
		return { getAgentUrl: getAgentHref };
	}
	const promptToPlatformUrl = createPromptPlatformUrl(platformUrl);
	return {
		getMcpUrl: createMcpPlatformUrl(platformUrl),
		getSkillUrl: (skillId: string) =>
			`${platformUrl}/#/skill/${skillId}/view`,
		getPromptUrl: (id: string) => promptToPlatformUrl({ id }),
		getAgentUrl: getAgentHref,
	};
};
