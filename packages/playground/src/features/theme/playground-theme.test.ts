import { expect, test } from "vitest";
import {
	mergePlaygroundTheme,
	resolvePlaygroundServerTheme,
} from "@semoss/shared";
import { ENV_THEME } from "@/features/theme/playground-theme";

/**
 * The playground's theme for a server theme: the server's over the build's.
 *
 * @param serverTheme - The server's `THEME_MAP`, or null.
 * @returns The theme.
 */
const resolveTheme = (serverTheme: Record<string, unknown> | null) =>
	resolvePlaygroundServerTheme(serverTheme, ENV_THEME);

test("no server theme, or none for the playground, gives the defaults", () => {
	const defaults = resolveTheme(null);
	expect(defaults.sidebar.expandedByDefault).toBe(true);
	expect(defaults.featureFlags?.enableModelSelect).toBe(true);
	expect(resolveTheme({ client: { name: "Client" } })).toBe(defaults);
});

test("the same server theme returns the same object", () => {
	const server = { playground: { name: "Team" } };
	const theme = resolveTheme(server);
	expect(theme.name).toBe("Team");
	expect(resolveTheme(server)).toBe(theme);
	expect(resolveTheme({ playground: { name: "Team" } })).not.toBe(theme);
});

test("legacy top-level flags migrate, and explicit feature flags win", () => {
	const defaults = resolveTheme(null);
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
	const theme = resolveTheme({
		playground: { images: { login: "/login.png" } },
	});
	expect(theme.images.login).toBe("/login.png");
	expect(theme.images.error).toBe("");
	expect(theme.sidebar.expandedByDefault).toBe(true);
});
