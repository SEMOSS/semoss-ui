import { useConfig } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import { THEME } from "@/constants";

/**
 * The platform's branding and notices: the server's theme, with the client's
 * defaults for what it leaves out.
 */
export interface PlatformTheme {
	name: string;
	logo: string;
	logoLight: string;
	includeNameWithLogo: boolean;
	loginHeroImage: string;
	loginHeroImageDark: string;
	landingPageName: string;
	cookiePolicyBannerReact: string;
	cookiePolicyOrderReact: string[];
	cookiePoliciesReact: Record<string, unknown>;
	cookiePolicyModalBodyReact: string;
	cookiePolicyModalHeaderReact: string;
	cookiePolicyNoticePage: string;
	helpBannerOrder: string[];
	helpBannerValues: Record<string, unknown>;
	privacyNoticePage: string;
	termsHeaderReact: string;
	termsReact: string;
	/** Any other key the server's theme sends, such as `featureFlags`. */
	[key: string]: unknown;
}

/** Kept once, so a theme without them selects the same lists every time. */
const NO_TEXTS: string[] = [];
const NO_ENTRIES: Record<string, unknown> = {};

/**
 * Read text from the theme.
 *
 * @param value - The theme's value.
 * @param fallback - The client's default.
 * @returns The value when it is text, else the default.
 */
const readText = (value: unknown, fallback: string): string =>
	typeof value === "string" ? value : fallback;

/**
 * Whether a theme value is a list of text.
 *
 * @param value - The theme's value.
 * @returns True for a list holding only text.
 */
const isTextList = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((item) => typeof item === "string");

/**
 * Lay the client's defaults under the server's theme. Each value keeps its
 * identity, so an unchanged theme selects an equal record.
 *
 * @param theme - The server's parsed theme, or null when it has none.
 * @returns The theme, with a default for each value it leaves out or sends
 * in the wrong shape.
 */
const withThemeDefaults = (
	theme: Record<string, unknown> | null,
): PlatformTheme => ({
	...theme,
	name: readText(theme?.name, THEME.name),
	logo: readText(theme?.logo, THEME.logo),
	logoLight: readText(theme?.logoLight, THEME.logoLight),
	includeNameWithLogo:
		typeof theme?.includeNameWithLogo === "boolean"
			? theme.includeNameWithLogo
			: true,
	loginHeroImage: readText(theme?.loginHeroImage, ""),
	loginHeroImageDark: readText(theme?.loginHeroImageDark, ""),
	landingPageName: readText(theme?.landingPageName, THEME.name),
	cookiePolicyBannerReact: readText(theme?.cookiePolicyBannerReact, ""),
	cookiePolicyOrderReact: isTextList(theme?.cookiePolicyOrderReact)
		? theme.cookiePolicyOrderReact
		: NO_TEXTS,
	cookiePoliciesReact: isRecord(theme?.cookiePoliciesReact)
		? theme.cookiePoliciesReact
		: NO_ENTRIES,
	cookiePolicyModalBodyReact: readText(theme?.cookiePolicyModalBodyReact, ""),
	cookiePolicyModalHeaderReact: readText(
		theme?.cookiePolicyModalHeaderReact,
		"",
	),
	cookiePolicyNoticePage: readText(theme?.cookiePolicyNoticePage, ""),
	helpBannerOrder: isTextList(theme?.helpBannerOrder)
		? theme.helpBannerOrder
		: NO_TEXTS,
	helpBannerValues: isRecord(theme?.helpBannerValues)
		? theme.helpBannerValues
		: NO_ENTRIES,
	privacyNoticePage: readText(theme?.privacyNoticePage, ""),
	termsHeaderReact: readText(theme?.termsHeaderReact, ""),
	termsReact: readText(theme?.termsReact, ""),
});

/**
 * Read the platform's theme from the system config, with the client's
 * defaults until the config is read and for anything the theme leaves out.
 * Distinct from `useTheme` in `@semoss/ui/next`, which is light or dark mode.
 *
 * @returns The theme.
 */
export const usePlatformTheme = (): PlatformTheme =>
	useConfig((state) => withThemeDefaults(state.theme));
