import {
	type AgentLinks,
	createMcpPlatformUrl,
	createPromptPlatformUrl,
} from "@semoss/shared";
import { PLATFORM_URL } from "@/features/chat-config/platform-url";

/** Builds the platform URL of an MCP. */
const mcpToPlatformUrl = createMcpPlatformUrl(PLATFORM_URL);
/** Builds the platform URL of a prompt. */
const promptToPlatformUrl = createPromptPlatformUrl(PLATFORM_URL);
/**
 * Builds the platform URL of a skill.
 *
 * @param skillId - The skill's id.
 * @returns The skill's view page on the platform.
 */
const skillToPlatformUrl = (skillId: string): string =>
	`${PLATFORM_URL}/#/skill/${skillId}/view`;

/**
 * The playground's links for an agent's attached resources, used by the
 * shared agent views. Catalog links point at the platform and only appear
 * when the theme turns platform links on; subagents link to the playground's
 * own agent page.
 *
 * @param showPlatformLinks - Whether the theme turns platform links on.
 * @returns The link builders for the shared agent views.
 */
export const getPlaygroundAgentLinks = (
	showPlatformLinks?: boolean,
): AgentLinks => ({
	...(showPlatformLinks
		? {
				getMcpUrl: mcpToPlatformUrl,
				getSkillUrl: skillToPlatformUrl,
				getPromptUrl: (id: string) => promptToPlatformUrl({ id }),
			}
		: {}),
	getAgentUrl: (id) => `#/agent/${id}`,
});
