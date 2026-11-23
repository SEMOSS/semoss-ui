import { expect, test } from "vitest";
import {
	readPlaygroundBuildNewChat,
	readPlaygroundBuildTheme,
} from "./playground-build-env";
import { DEFAULT_PLAYGROUND_THEME } from "./playground-theme";

test("the build's name and theme lie over the defaults, wrapped or flat", () => {
	expect(readPlaygroundBuildTheme({})).toEqual(DEFAULT_PLAYGROUND_THEME);
	expect(readPlaygroundBuildTheme({ VITE_NAME: "Acme" }).name).toBe("Acme");
	const wrapped = readPlaygroundBuildTheme({
		VITE_THEME: JSON.stringify({ playground: { description: "Wrapped" } }),
	});
	const flat = readPlaygroundBuildTheme({
		VITE_THEME: JSON.stringify({ description: "Flat" }),
	});
	expect(wrapped.description).toBe("Wrapped");
	expect(flat.description).toBe("Flat");
});

test("a malformed build theme keeps the defaults", () => {
	expect(readPlaygroundBuildTheme({ VITE_THEME: "{not json" })).toEqual(
		DEFAULT_PLAYGROUND_THEME,
	);
});

test("the build's new-chat defaults leave out what is unset", () => {
	expect(
		readPlaygroundBuildNewChat({
			VITE_DEFAUlT_MODEL_ID: "model-1",
			VITE_DEFAULT_CHAT_MODE: "",
		}),
	).toEqual({
		modelId: "model-1",
		modelName: undefined,
		mode: undefined,
		agentId: undefined,
	});
});
