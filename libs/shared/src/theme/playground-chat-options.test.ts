import { describe, expect, test } from "vitest";
import { playgroundThemeChatOptions } from "./playground-chat-options";
import {
	DEFAULT_PLAYGROUND_THEME,
	mergePlaygroundTheme,
	type PlaygroundTheme,
} from "./playground-theme";

/** The default theme with the given feature flags laid over it. */
const withFlags = (
	featureFlags: PlaygroundTheme["featureFlags"],
): PlaygroundTheme =>
	mergePlaygroundTheme(DEFAULT_PLAYGROUND_THEME, { featureFlags });

const ROOM_ACTIONS = [
	"favorite",
	"publish",
	"rename",
	"download",
	"delete",
] as const;
const MESSAGE_ACTIONS = ["rewrite", "feedback", "copy", "download"] as const;

describe("playgroundThemeChatOptions", () => {
	test("the default theme keeps every part the chat shows by default", () => {
		const options = playgroundThemeChatOptions(
			DEFAULT_PLAYGROUND_THEME,
			{},
		);
		expect(options).toMatchObject({
			agentMode: "chat-only",
			isModelSelectable: true,
			isTemperatureEditable: false,
			hasPromptOptimizer: true,
			isTableExportable: false,
			hasFeedbackComment: true,
			hasSystemCatalogItems: true,
			shouldMakeKnowledgeMcp: true,
			isEmbedderSelectable: true,
			roomActions: undefined,
			messageActions: undefined,
			catalogItemHref: undefined,
		});
	});

	test("platform links follow the flag and need the platform's URL", () => {
		const href = playgroundThemeChatOptions(
			withFlags({ showPlatformLinks: true }),
			{},
			"/platform",
		).catalogItemHref;
		expect(href?.({ id: "e1", type: "VECTOR" })).toContain("/platform");
		expect(
			playgroundThemeChatOptions(withFlags({ showPlatformLinks: true }))
				.catalogItemHref,
		).toBeUndefined();
	});

	test("a theme that turns flags off turns the chat's options off", () => {
		const options = playgroundThemeChatOptions(
			withFlags({
				enableModelSelect: false,
				enableSuggestions: false,
				enablePromptOptimizer: false,
				enableFeedbackText: false,
				showPlatformLinks: false,
				showSystemTools: false,
				enableKnowledgeMCP: false,
				allowEmbeddingOptions: false,
				enableDarkMode: false,
			}),
			{},
		);
		expect(options).toMatchObject({
			isModelSelectable: false,
			hasPromptOptimizer: false,
			hasFeedbackComment: false,
			hasSystemCatalogItems: false,
			shouldMakeKnowledgeMcp: false,
			isEmbedderSelectable: false,
		});
	});

	test("Rewrite and Favorite leave with their flags", () => {
		const options = playgroundThemeChatOptions(
			withFlags({ enableRewrite: false, hideChatHistory: true }),
			{},
		);
		expect(options.messageActions?.(MESSAGE_ACTIONS)).toEqual([
			"feedback",
			"copy",
			"download",
		]);
		expect(options.roomActions?.(ROOM_ACTIONS)).toEqual([
			"publish",
			"rename",
			"download",
			"delete",
		]);
	});

	test("agent-only wins over the agent picker, which wins over the choice", () => {
		const modeOf = (flags: PlaygroundTheme["featureFlags"]) =>
			playgroundThemeChatOptions(withFlags(flags), {}).agentMode;
		expect(modeOf({ enableAgentHarness: true })).toBe("choice");
		expect(
			modeOf({ enableAgentHarness: true, modeFollowsAgent: true }),
		).toBe("follows-agent");
		expect(modeOf({ modeFollowsAgent: true, agentModeOnly: true })).toBe(
			"agent-only",
		);
	});

	test("the theme's new-chat defaults sit over the build's", () => {
		const build = {
			modelId: "env-model",
			modelName: "Env Model",
			mode: "chat",
			agentId: "env-agent",
		};
		expect(
			playgroundThemeChatOptions(DEFAULT_PLAYGROUND_THEME, build).newChat,
		).toMatchObject(build);

		const theme = mergePlaygroundTheme(DEFAULT_PLAYGROUND_THEME, {
			defaultRoomSettings: {
				model: {
					engine_id: "theme-model",
					engine_name: "theme_model",
					engine_display_name: "Theme Model",
					engine_type: "MODEL",
				},
				mode: "agent",
				temperature: 0.4,
			},
			defaultTools: [{ id: "tool", name: "Tool", type: "FUNCTION" }],
		});
		expect(playgroundThemeChatOptions(theme, build).newChat).toEqual({
			modelId: "theme-model",
			modelName: "Theme Model",
			mode: "agent",
			agentId: "env-agent",
			temperature: 0.4,
			tools: [{ id: "tool", name: "Tool", type: "FUNCTION" }],
		});
	});
});
