// Client-specific translations
import { coreResources } from "./core";

// Add client-specific namespaces here when needed
export const clientResources = {
	en: {
		...coreResources.en,
		// Add client namespaces here
	},
	es: {
		...coreResources.es,
		// Add client namespaces here
	},
	fr: {
		...coreResources.fr,
		// Add client namespaces here
	},
	hi: {
		...coreResources.hi,
		// Add client namespaces here
	},
	ar: {
		...coreResources.ar,
		// Add client namespaces here
	},
	ja: {
		...coreResources.ja,
		// Add client namespaces here
	},
} as const;
