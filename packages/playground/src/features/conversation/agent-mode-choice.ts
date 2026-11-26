import type { ThemeMap } from "@semoss/shared";
import type { NewChatMode } from "@/features/new-chat-preferences/new-chat-preferences";

/**
 * Whether every new chat runs in agent mode (`agentModeOnly`): chat mode is
 * never offered, and a chat with no saved agent runs Default Agent.
 *
 * @param featureFlags - The playground theme's feature flags.
 * @returns True when chat mode is never offered.
 */
export const isAgentModeOnly = (
	featureFlags: ThemeMap["playground"]["featureFlags"],
): boolean => Boolean(featureFlags?.agentModeOnly);

/**
 * Whether users pick a new chat's mode with the Chat and Agent choice. False
 * when the theme lets the agent picker decide the mode instead
 * (`modeFollowsAgent`), where No Agent and Default Agent are separate choices,
 * and when every chat runs in agent mode (`agentModeOnly`).
 *
 * @param featureFlags - The playground theme's feature flags.
 * @returns True when the Chat and Agent choice is offered.
 */
export const canChooseAgentMode = (
	featureFlags: ThemeMap["playground"]["featureFlags"],
): boolean =>
	Boolean(featureFlags?.enableAgentHarness) &&
	!featureFlags?.modeFollowsAgent &&
	!isAgentModeOnly(featureFlags);

/**
 * Whether a new chat can run in agent mode: users pick it with the Chat and
 * Agent choice (`enableAgentHarness`), the agent picker decides it
 * (`modeFollowsAgent`), or every chat runs in it (`agentModeOnly`).
 *
 * @param featureFlags - The playground theme's feature flags.
 * @returns True when agent mode is offered.
 */
export const offersAgentMode = (
	featureFlags: ThemeMap["playground"]["featureFlags"],
): boolean =>
	Boolean(
		featureFlags?.enableAgentHarness ||
			featureFlags?.modeFollowsAgent ||
			isAgentModeOnly(featureFlags),
	);

/**
 * The modes a new chat can start in, chat first: agent alone where every chat
 * runs in agent mode, chat alone where agent mode is not offered, else both.
 *
 * @param featureFlags - The playground theme's feature flags.
 * @returns The modes offered.
 */
export const newChatModes = (
	featureFlags: ThemeMap["playground"]["featureFlags"],
): readonly NewChatMode[] => {
	if (isAgentModeOnly(featureFlags)) return ["agent"];
	return offersAgentMode(featureFlags) ? ["chat", "agent"] : ["chat"];
};

/**
 * Whether the agent picker names its choice of no saved agent Default Agent
 * rather than No Agent: users pick the mode with the Chat and Agent choice, or
 * every chat runs in agent mode.
 *
 * @param featureFlags - The playground theme's feature flags.
 * @returns True when the no-agent choice is Default Agent.
 */
export const offersDefaultAgent = (
	featureFlags: ThemeMap["playground"]["featureFlags"],
): boolean => canChooseAgentMode(featureFlags) || isAgentModeOnly(featureFlags);
