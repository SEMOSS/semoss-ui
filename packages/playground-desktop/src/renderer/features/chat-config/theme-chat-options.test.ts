import { describe, expect, test } from "vitest";
import {
	DEFAULT_PLAYGROUND_THEME,
	mergePlaygroundTheme,
	type PlaygroundTheme,
} from "@semoss/shared";
import { themeToChatOptions } from "./theme-chat-options";

/** The default theme with the given feature flags laid over it. */
const withFlags = (
	featureFlags: PlaygroundTheme["featureFlags"],
): PlaygroundTheme =>
	mergePlaygroundTheme(DEFAULT_PLAYGROUND_THEME, { featureFlags });

describe("themeToChatOptions", () => {
	test("the default theme keeps every part the chat shows by default", () => {
		expect(themeToChatOptions(DEFAULT_PLAYGROUND_THEME)).toMatchObject({
			agentMode: "chat-only",
			isModelSelectable: true,
			hasPromptOptimizer: true,
			hasFeedbackComment: true,
			roomActions: undefined,
			messageActions: undefined,
		});
	});

	test("the server's flags turn the chat's parts off", () => {
		const options = themeToChatOptions(
			withFlags({
				enableModelSelect: false,
				enableRewrite: false,
				hideChatHistory: true,
				enableDarkMode: false,
				agentModeOnly: true,
			}),
		);
		expect(options).toMatchObject({
			agentMode: "agent-only",
			isModelSelectable: false,
		});
		expect(
			options.messageActions?.([
				"rewrite",
				"feedback",
				"copy",
				"download",
			]),
		).toEqual(["feedback", "copy", "download"]);
		expect(
			options.roomActions?.([
				"favorite",
				"publish",
				"rename",
				"download",
				"delete",
			]),
		).toEqual(["publish", "rename", "download", "delete"]);
	});

	test("the server's room defaults are the new chat's", () => {
		const theme = mergePlaygroundTheme(DEFAULT_PLAYGROUND_THEME, {
			defaultRoomSettings: {
				model: {
					engine_id: "model-a",
					engine_name: "model_a",
					engine_type: "MODEL",
				},
				mode: "agent",
				agentId: "agent-1",
			},
		});
		expect(themeToChatOptions(theme).newChat).toMatchObject({
			modelId: "model-a",
			modelName: "model_a",
			mode: "agent",
			agentId: "agent-1",
		});
	});
});
