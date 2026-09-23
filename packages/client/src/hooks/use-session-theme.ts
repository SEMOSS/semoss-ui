import { useMemo } from "react";
import type { SystemConfig } from "@semoss/sdk";
import { useSession } from "@semoss/sdk/react";
import { THEME } from "@/constants";

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

const themeFor = (config: SystemConfig | null): RootTheme => {
	const fallback: RootTheme = {
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
	const themeMap = config?.theme?.THEME_MAP;
	if (!themeMap) {
		return fallback;
	}

	try {
		const parsed: unknown = JSON.parse(themeMap);
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return fallback;
		}
		return { ...fallback, ...parsed };
	} catch {
		return fallback;
	}
};

/** Select client presentation values derived from the validated raw theme map. */
export const useSessionTheme = <Selected>(
	selector: (theme: RootTheme) => Selected,
): Selected => {
	const config = useSession((state) => state.config.data);
	const theme = useMemo(() => themeFor(config), [config]);
	return selector(theme);
};
