import type { RoomEngineConfig } from "@semoss/sdk";
import type { ThemeMap } from "@semoss/shared";
import type { ChatHostConfig } from "./chat-host-config";

/** What a playground theme sets of a chat, before the host adds its own. */
export type ChatThemeSettings = Pick<
	ChatHostConfig,
	| "appName"
	| "featureFlags"
	| "defaultTools"
	| "defaultTemperature"
	| "allowedFileTypes"
	| "allowedUrlPrefixes"
	| "gracefulErrors"
	| "defaultCompactionStrategy"
	| "fileDragDisclaimer"
	| "defaultEmbedderId"
> & {
	/** How rooms run, without the host's client tools. */
	engine: RoomEngineConfig;
};

/**
 * The chat settings a playground theme sets (the deployment's `VITE_THEME`,
 * an instance's `THEME_MAP.playground`): its name, feature switches, limits,
 * default tools and temperature, file types, link prefixes and friendly
 * errors. A host spreads them into its `ChatHostConfig` and adds its own:
 * client tools, panels, integrations, navigation.
 *
 * @param theme - The playground theme; anything it leaves out keeps its default.
 * @param fallbackName - The name when the theme gives none.
 * @returns The settings.
 */
export const chatSettingsFromTheme = (
	theme: Partial<ThemeMap["playground"]>,
	fallbackName = "SEMOSS Playground",
): ChatThemeSettings => {
	const appName = theme.name || fallbackName;
	return {
		appName: appName,
		engine: {
			appName: appName,
			toolAutoExecutionLimit: theme.toolAutoExecutionLimit,
			sendTemperature: Boolean(theme.featureFlags?.enableTemperature),
			allowedFileTypes: theme.allowedFileTypes,
			defaultRoomSettings: {
				model: theme.defaultRoomSettings?.model?.engine_id,
			},
		},
		featureFlags: theme.featureFlags ?? {},
		defaultTools: theme.defaultTools,
		defaultTemperature: theme.defaultRoomSettings?.temperature,
		allowedFileTypes: theme.allowedFileTypes ?? [],
		allowedUrlPrefixes: theme.allowedUrlPrefixes ?? [],
		gracefulErrors: theme.gracefulErrors ?? [],
		defaultCompactionStrategy: theme.defaultCompactionStrategy,
		fileDragDisclaimer: theme.fileDragDisclaimer,
		defaultEmbedderId: theme.defaultEmbedderId,
	};
};
