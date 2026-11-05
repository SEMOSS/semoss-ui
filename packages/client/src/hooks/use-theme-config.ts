import { useConfig } from "@semoss/sdk/react";
import { THEME } from "@/constants";

/** The server's theme, with the client's defaults under it. */
export interface ThemeConfig {
	name: string;
	logo: string;
	logoLight: string;
	includeNameWithLogo: boolean;
	loginHeroImage: string;
	loginHeroImageDark: string;
	landingPageName: string;
	cookiePolicyBannerReact: string;
	cookiePolicyOrderReact: string[];
	cookiePoliciesReact: unknown;
	cookiePolicyModalBodyReact: string;
	cookiePolicyModalHeaderReact: string;
	cookiePolicyNoticePage: string;
	helpBannerOrder: string[];
	helpBannerValues: unknown;
	privacyNoticePage: string;
	termsHeaderReact: string;
	termsReact: string;
	featureFlags?: { enableDarkMode?: boolean };
}

/** What the client shows before, or without, a server theme. */
const DEFAULT_THEME: ThemeConfig = {
	name: THEME.name,
	logo: THEME.logo,
	logoLight: THEME.logoLight,
	includeNameWithLogo: true,
	loginHeroImage: "",
	loginHeroImageDark: "",
	landingPageName: THEME.name,
	cookiePolicyBannerReact: "",
	cookiePolicyOrderReact: [],
	cookiePoliciesReact: {},
	cookiePolicyModalBodyReact: "",
	cookiePolicyModalHeaderReact: "",
	cookiePolicyNoticePage: "",
	helpBannerOrder: [],
	helpBannerValues: {},
	privacyNoticePage: "",
	termsHeaderReact: "",
	termsReact: "",
};

/**
 * Read the server's theme (its parsed `THEME_MAP`) with the client's defaults
 * for every field it leaves out.
 *
 * @returns The theme.
 */
export const useThemeConfig = (): ThemeConfig =>
	useConfig((state) => ({ ...DEFAULT_THEME, ...state.theme }) as ThemeConfig);
