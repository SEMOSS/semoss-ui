import { createRoot } from "react-dom/client";
import { Session } from "@semoss/sdk";
import { App, i18nReady } from "./app";
import { InstanceStore } from "./features/instances/instance.store";
import { createDesktopPreferences } from "./host/desktop-preferences";
import { loadAppStore } from "./platform/app-store";
import { configureSdkHost } from "./platform/sdk-host";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
	throw new Error("Root element #root not found");
}
const root = createRoot(container);

/**
 * Start the app: read the saved instances, and when one is in use, point the
 * SDK at it and start its session before the first render.
 */
const mount = async () => {
	const appStore = await loadAppStore();
	const instances = new InstanceStore(appStore);
	await instances.load();
	const active = instances.activeInstance;
	let preferences = null;
	if (active) {
		await configureSdkHost(active);
		// read the config and the signed in user once for the whole app; the
		// layouts gate on `useConfig` and `useSession`
		void Session.initialize();
		preferences = await createDesktopPreferences(appStore, active.id);
	}
	await i18nReady;
	root.render(<App instances={instances} preferences={preferences} />);
};

void mount();
