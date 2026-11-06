// Playground-specific lazy translations: the chat UI's (`chatResources`),
// plus the playground's own chrome.
import { chatResources } from "./chat";
import type { LazyResources } from "./types";

export const playgroundResources: LazyResources = {
	ns: [...chatResources.ns, "appNav", "tour", "mobile"],
	load: {
		...chatResources.load,
		// the navigation sidebar's own items, search and user menu
		appNav: (l) => import(`./locales/${l}/playground/app-nav.json`),
		tour: (l) => import(`./locales/${l}/playground/tour.json`),
		mobile: (l) => import(`./locales/${l}/playground/mobile.json`),
	},
};
