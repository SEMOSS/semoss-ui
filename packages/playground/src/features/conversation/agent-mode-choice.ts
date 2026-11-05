import type { ThemeMap } from "@semoss/shared";

/**
 * Whether users pick a new chat's mode themselves, and so can run agent mode
 * without a saved agent. False when the theme lets the selected agent decide
 * the mode (`modeFollowsAgent`).
 *
 * @param featureFlags - The playground theme's feature flags.
 * @returns True when the Chat and Agent choice is offered.
 */
export const canChooseAgentMode = (
	featureFlags: ThemeMap["playground"]["featureFlags"],
): boolean =>
	Boolean(featureFlags?.enableAgentHarness) &&
	!featureFlags?.modeFollowsAgent;
