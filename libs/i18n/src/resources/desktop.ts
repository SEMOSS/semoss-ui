// The desktop app's lazy translations: the chat UI's (`chatResources`),
// plus the desktop shell's own (instances, sign in, nav, desktop tools and
// panels).
import { chatResources } from "./chat";
import type { LazyResources } from "./types";

export const desktopResources: LazyResources = {
	ns: [...chatResources.ns, "desktop"],
	load: {
		...chatResources.load,
		desktop: (l) => import(`./locales/${l}/desktop/desktop.json`),
	},
};
