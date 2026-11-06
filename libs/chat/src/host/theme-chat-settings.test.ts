import { expect, test } from "vitest";
import { chatSettingsFromTheme } from "./theme-chat-settings";

test("a theme's chat settings reach the engine and the UI", () => {
	const settings = chatSettingsFromTheme({
		name: "Acme",
		featureFlags: { enableTemperature: true },
		toolAutoExecutionLimit: 2,
		defaultTools: [{ type: "FUNCTION", id: "t1", name: "Tool" }],
		defaultRoomSettings: { temperature: 0.4 },
		allowedFileTypes: ["pdf"],
	});
	expect(settings.appName).toBe("Acme");
	expect(settings.engine).toMatchObject({
		appName: "Acme",
		toolAutoExecutionLimit: 2,
		sendTemperature: true,
		allowedFileTypes: ["pdf"],
	});
	expect(settings.defaultTools).toEqual([
		{ type: "FUNCTION", id: "t1", name: "Tool" },
	]);
	expect(settings.defaultTemperature).toBe(0.4);
});

test("an empty theme keeps every default", () => {
	const settings = chatSettingsFromTheme({}, "Desk");
	expect(settings.appName).toBe("Desk");
	expect(settings.featureFlags).toEqual({});
	expect(settings.allowedUrlPrefixes).toEqual([]);
	expect(settings.gracefulErrors).toEqual([]);
	expect(settings.engine.sendTemperature).toBe(false);
});
