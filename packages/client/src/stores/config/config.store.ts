import { createStore, type StoreApi } from "zustand";
import { CSRF, Env } from "@semoss/sdk/react";
import { config as getConfig } from "@/api";
import { THEME } from "@/constants";

interface MetaKey {
	display_options: string;
	display_order: number;
	metakey: string;
	single_multi: string;
	display_values?: string;
}

interface RootConfig {
	databaseMetaKeys: MetaKey[];
	projectMetaKeys: MetaKey[];
	availableProviders: {
		provider: string;
		name: string;
		label?: string;
		isOauth: boolean;
	}[];
	nativeRegistration: boolean;
	version: { datetime: string; version: string };
	r: boolean;
	python: boolean;
	csrf: boolean;
	adminOnlyViewMenuBarFlag: boolean;
	notificationEnabled: boolean;
	[key: string]: unknown;
}

interface RootTheme {
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
}

export interface ConfigStoreState {
	config: RootConfig;
	theme: RootTheme;
	/** Fetch platform config/theme; returns whether any login provider exists. */
	initialize: () => Promise<boolean>;
}

const initialConfig = (): RootConfig => ({
	databaseMetaKeys: [],
	projectMetaKeys: [],
	availableProviders: [],
	nativeRegistration: false,
	version: { version: "", datetime: "" },
	r: true,
	python: true,
	csrf: false,
	adminOnlyViewMenuBarFlag: false,
	notificationEnabled: false,
});

const themeFor = (config: RootConfig): RootTheme => {
	const defaultTheme: RootTheme = {
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
	const themeMap = (config.theme as { THEME_MAP?: string } | undefined)
		?.THEME_MAP;
	if (!themeMap) return defaultTheme;
	try {
		return { ...defaultTheme, ...JSON.parse(themeMap) };
	} catch {
		return defaultTheme;
	}
};

export const createConfigStore = (): StoreApi<ConfigStoreState> =>
	createStore<ConfigStoreState>()((set, get) => ({
		config: initialConfig(),
		theme: themeFor(initialConfig()),
		initialize: async () => {
			const data = await getConfig();

			const loggedIn = Object.keys(data.logins || {}).length > 0;
			const config = { ...get().config, ...data } as RootConfig;
			config.databaseMetaKeys?.sort((a, b) =>
				a.display_order > b.display_order ? 1 : -1,
			);
			config.projectMetaKeys?.sort((a, b) =>
				a.display_order > b.display_order ? 1 : -1,
			);
			set({ config, theme: themeFor(config) });

			// set the csrf
			CSRF.isEnabled = config.csrf;
			Env.update({ CSRF: config.csrf });

			return loggedIn;
		},
	}));

export type ConfigStore = StoreApi<ConfigStoreState>;
