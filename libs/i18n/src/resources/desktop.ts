// Desktop lazy translations: the chat's namespaces, plus the desktop app's own
// connect screen and account menu.
import { chatResources } from "./chat";
import type { LazyResources } from "./types";

export const desktopResources: LazyResources = {
	ns: [...chatResources.ns, "desktop"],
	load: {
		...chatResources.load,
		desktop: (l) => import(`./locales/${l}/desktop/desktop.json`),
	},
};
