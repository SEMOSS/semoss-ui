import { createMcpPlatformUrl } from "../components/mcp/mcp-utils";
import type { PlaygroundBuildNewChat } from "./playground-build-env";
import type { PlaygroundTheme } from "./playground-theme";

/** How a new chat's mode is chosen (`AgentModePolicy` in `@semoss/chat`). */
export type PlaygroundAgentMode =
	| "chat-only"
	| "choice"
	| "follows-agent"
	| "agent-only";

/**
 * How the theme's flags choose a new chat's mode: `agentModeOnly` wins, then
 * `modeFollowsAgent`, then `enableAgentHarness`.
 *
 * @param flags - The theme's feature flags.
 * @returns The chat's agent mode policy.
 */
const readAgentMode = (
	flags: PlaygroundTheme["featureFlags"],
): PlaygroundAgentMode => {
	if (flags?.agentModeOnly) return "agent-only";
	if (flags?.modeFollowsAgent) return "follows-agent";
	if (flags?.enableAgentHarness) return "choice";
	return "chat-only";
};

/**
 * The playground theme as the chat's options (`ChatOptions` in
 * `@semoss/chat`, which this package cannot import): its feature flags,
 * defaults, and limits, with the build's new-chat defaults under the theme's.
 * Each app spreads it into its own options beside its routes.
 *
 * @param theme - The playground theme, with every default filled in.
 * @param build - The build's new-chat defaults, from its `.env`.
 * @param platformUrl - Where the platform app is served; the catalog
 * pickers link there where the theme shows platform links.
 * @returns The options; the app adds its routes and URLs.
 */
export const playgroundThemeChatOptions = (
	theme: PlaygroundTheme,
	build: PlaygroundBuildNewChat = {},
	platformUrl?: string,
) => {
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
		shouldMakeKnowledgeMcp: !!flags?.enableKnowledgeMCP,
		isEmbedderSelectable: !!flags?.allowEmbeddingOptions,
		defaultEmbedderId: theme.defaultEmbedderId,
		allowedFileTypes: theme.allowedFileTypes,
		fileDragDisclaimer: theme.fileDragDisclaimer,
		allowedUrlPrefixes: theme.allowedUrlPrefixes,
		toolAutoExecutionLimit: theme.toolAutoExecutionLimit,
		compactionStrategy: theme.defaultCompactionStrategy,
		gracefulErrors: theme.gracefulErrors,
		// with no room list there is nothing to favorite into
		roomActions: flags?.hideChatHistory
			? <T extends string>(actions: readonly T[]) =>
					actions.filter((id) => id !== "favorite")
			: undefined,
		messageActions: flags?.enableRewrite
			? undefined
			: <T extends string>(actions: readonly T[]) =>
					actions.filter((id) => id !== "rewrite"),
		catalogItemHref:
			platformUrl !== undefined && flags?.showPlatformLinks
				? createMcpPlatformUrl(platformUrl)
				: undefined,
	};
};
