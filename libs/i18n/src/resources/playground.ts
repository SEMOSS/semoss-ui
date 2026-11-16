// Playground lazy translations: the chat's namespaces, plus the playground's
// own landing tour and mobile notice.
import { chatResources } from "./chat";
import type { LazyResources } from "./types";

export const playgroundResources: LazyResources = {
	ns: [...chatResources.ns, "tour", "mobile"],
	load: {
		...chatResources.load,
		tour: (l) => import(`./locales/${l}/playground/tour.json`),
		mobile: (l) => import(`./locales/${l}/playground/mobile.json`),
	},
};
