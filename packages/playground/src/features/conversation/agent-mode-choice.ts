import type { ThemeMap } from "@semoss/shared";

/**
 * Whether users pick a new chat's mode with the Chat and Agent choice. False
 * when the theme lets the agent picker decide the mode instead
 * (`modeFollowsAgent`), where No Agent and Default Agent are separate choices.
 *
 * @param featureFlags - The playground theme's feature flags.
 * @returns True when the Chat and Agent choice is offered.
 */
export const canChooseAgentMode = (
	featureFlags: ThemeMap["playground"]["featureFlags"],
): boolean =>
	Boolean(featureFlags?.enableAgentHarness) &&
	!featureFlags?.modeFollowsAgent;
