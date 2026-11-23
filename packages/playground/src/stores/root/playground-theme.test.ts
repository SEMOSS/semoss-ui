import { expect, test } from "vitest";
import {
	mergePlaygroundTheme,
	withPlaygroundDefaults,
} from "./playground-theme";

test("no server theme, or none for the playground, gives the defaults", () => {
	const defaults = withPlaygroundDefaults(null);
	expect(defaults.sidebar.expandedByDefault).toBe(true);
	expect(defaults.featureFlags?.enableModelSelect).toBe(true);
	expect(withPlaygroundDefaults({ client: { name: "Client" } })).toBe(
		defaults,
	);
});

test("the same server theme returns the same object", () => {
	const server = { playground: { name: "Team" } };
	const theme = withPlaygroundDefaults(server);
	expect(theme.name).toBe("Team");
	expect(withPlaygroundDefaults(server)).toBe(theme);
	expect(withPlaygroundDefaults({ playground: { name: "Team" } })).not.toBe(
		theme,
	);
});

test("legacy top-level flags migrate, and explicit feature flags win", () => {
	const defaults = withPlaygroundDefaults(null);
	const legacy = mergePlaygroundTheme(defaults, {
		hideToolsInIframe: true,
		showPlatformLinks: false,
	} as Parameters<typeof mergePlaygroundTheme>[1]);
	expect(legacy.featureFlags?.hideToolsInIframe).toBe(true);
	expect(legacy.featureFlags?.showPlatformLinks).toBe(false);

	const explicit = mergePlaygroundTheme(defaults, {
		hideToolsInIframe: true,
		featureFlags: { hideToolsInIframe: false },
	} as Parameters<typeof mergePlaygroundTheme>[1]);
	expect(explicit.featureFlags?.hideToolsInIframe).toBe(false);
	// the base is untouched
	expect(defaults.featureFlags?.hideToolsInIframe).toBe(false);
});

test("a server theme fills only what it sets", () => {
	const theme = withPlaygroundDefaults({
		playground: { images: { login: "/login.png" } },
	});
	expect(theme.images.login).toBe("/login.png");
	expect(theme.images.error).toBe("");
	expect(theme.sidebar.expandedByDefault).toBe(true);
});
