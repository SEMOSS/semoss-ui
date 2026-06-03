// Client-specific translations
import { coreResources } from "./core";
import { sharedResources } from "./shared";

// Add client-specific namespaces here when needed
export const clientResources = {
	en: {
		...coreResources.en,
		...sharedResources.en,
		// Add client namespaces here
	},
	es: {
		...coreResources.es,
		...sharedResources.es,
		// Add client namespaces here
	},
	fr: {
		...coreResources.fr,
		...sharedResources.fr,
		// Add client namespaces here
	},
	hi: {
		...coreResources.hi,
		...sharedResources.hi,
		// Add client namespaces here
	},
	ar: {
		...coreResources.ar,
		...sharedResources.ar,
		// Add client namespaces here
	},
	ja: {
		...coreResources.ja,
		...sharedResources.ja,
		// Add client namespaces here
	},
} as const;
