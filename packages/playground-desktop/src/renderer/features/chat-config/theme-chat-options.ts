import type { AgentModePolicy, ChatOptions } from "@semoss/chat";
import type { PlaygroundBuildNewChat, PlaygroundTheme } from "@semoss/shared";

/** The part of the chat's options the desktop reads from the server's theme. */
export type ThemeChatOptions = Omit<
	ChatOptions,
	"roomHref" | "agentHref" | "platformUrl" | "toolFrameOrigin"
>;

/**
 * How the theme's flags choose a new chat's mode: `agentModeOnly` wins, then
 * `modeFollowsAgent`, then `enableAgentHarness`.
 *
 * @param flags - The theme's feature flags.
 * @returns The chat's agent mode policy.
 */
const readAgentMode = (
	flags: PlaygroundTheme["featureFlags"],
): AgentModePolicy => {
	if (flags?.agentModeOnly) return "agent-only";
	if (flags?.modeFollowsAgent) return "follows-agent";
	if (flags?.enableAgentHarness) return "choice";
	return "chat-only";
};

/**
 * The playground theme as the chat's options: its feature flags, defaults,
 * and limits, with the build's new-chat defaults under the theme's.
 *
 * @param theme - The server's playground theme over the build's, with every
 * default filled in.
 * @param build - The build's new-chat defaults, from the playground's `.env`.
 * @returns The options; the desktop adds its routes and origins.
 */
export const themeToChatOptions = (
	theme: PlaygroundTheme,
	build: PlaygroundBuildNewChat = {},
): ThemeChatOptions => {
	const flags = theme.featureFlags;
	const settings = theme.defaultRoomSettings;
	return {
		appName: theme.name,
		newChat: {
			modelId: settings?.model?.engine_id || build.modelId,
			modelName:
				settings?.model?.engine_display_name ||
				settings?.model?.engine_name ||
				build.modelName,
			mode: settings?.mode || build.mode,
			agentId: settings?.agentId || build.agentId,
			temperature: settings?.temperature,
			tools: theme.defaultTools,
		},
		agentMode: readAgentMode(flags),
		isModelSelectable: !!flags?.enableModelSelect,
		isTemperatureEditable: !!flags?.enableTemperature,
		hasPromptOptimizer: !!flags?.enablePromptOptimizer,
		isTableExportable: !!flags?.enableTableExport,
		hasFeedbackComment: !!flags?.enableFeedbackText,
		hasSystemCatalogItems: flags?.showSystemTools ?? true,
		shouldMakeKnowledgeMcp: flags?.enableKnowledgeMCP ?? true,
		isEmbedderSelectable: flags?.allowEmbeddingOptions ?? true,
		defaultEmbedderId: theme.defaultEmbedderId,
		allowedFileTypes: theme.allowedFileTypes,
		fileDragDisclaimer: theme.fileDragDisclaimer,
		allowedUrlPrefixes: theme.allowedUrlPrefixes,
		toolAutoExecutionLimit: theme.toolAutoExecutionLimit,
		compactionStrategy: theme.defaultCompactionStrategy,
		gracefulErrors: theme.gracefulErrors,
		// with no room list there is nothing to favorite into
		roomActions: flags?.hideChatHistory
			? (actions) => actions.filter((id) => id !== "favorite")
			: undefined,
		messageActions: flags?.enableRewrite
			? undefined
			: (actions) => actions.filter((id) => id !== "rewrite"),
	};
};
