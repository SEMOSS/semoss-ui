// Client-specific translations

import { coreResources } from "./core";
import githubAppAR from "./locales/ar/client/githubApp.json";
import githubAppEN from "./locales/en/client/githubApp.json";
import githubAppES from "./locales/es/client/githubApp.json";
import githubAppFR from "./locales/fr/client/githubApp.json";
import githubAppHI from "./locales/hi/client/githubApp.json";
import githubAppJA from "./locales/ja/client/githubApp.json";
import githubAppNL from "./locales/nl/client/githubApp.json";
import { sharedResources } from "./shared";

export const clientResources = {
	en: {
		...coreResources.en,
		...sharedResources.en,
		githubApp: githubAppEN,
	},
	es: {
		...coreResources.es,
		...sharedResources.es,
		githubApp: githubAppES,
	},
	fr: {
		...coreResources.fr,
		...sharedResources.fr,
		githubApp: githubAppFR,
	},
	hi: {
		...coreResources.hi,
		...sharedResources.hi,
		githubApp: githubAppHI,
	},
	ar: {
		...coreResources.ar,
		...sharedResources.ar,
		githubApp: githubAppAR,
	},
	ja: {
		...coreResources.ja,
		...sharedResources.ja,
		githubApp: githubAppJA,
	},
	nl: {
		...coreResources.nl,
		githubApp: githubAppNL,
	},
} as const;
