import { createRoot } from "react-dom/client";
import { Env, Session } from "@semoss/sdk/react";
import { App, i18n, i18nReady } from "./app";
import { getDesktopBridge } from "./features/desktop-bridge/desktop-bridge";
import { syncLanguage } from "./features/language/sync-language";
import { ServerConnectView } from "./features/server-connection/server-connect-view";
import { Router } from "./pages/router";
import "./index.css";

/**
 * Render the app: the connect screen until a server is saved, then the
 * signed in routes on that server's module.
 *
 * @returns Once the first screen is rendered.
 */
const mount = async (): Promise<void> => {
	const container = document.getElementById("root");
	if (!container) {
		throw new Error("Root element #root not found");
	}
	// macOS hides the title bar (main-window.ts); index.css makes room for it
	if (navigator.userAgent.includes("Macintosh")) {
		document.documentElement.dataset.titlebar = "inset";
	}
	const bridge = getDesktopBridge();
	const root = createRoot(container);
	const [server] = await Promise.all([
		bridge.invoke("server-connection:get"),
		// the saved language, shared by every server, before the first paint
		i18nReady.then(() => syncLanguage(i18n, bridge)),
	]);

	if (!server) {
		// saving a server reloads the window, which then takes the path below
		root.render(
			<App>
				<ServerConnectView bridge={bridge} />
			</App>,
		);
		return;
	}

	// the module is on this origin: the main process forwards it to the server
	Env.update({ MODULE: server.module });
	void Session.initialize();
	root.render(
		<App>
			<Router />
		</App>,
	);
};

void mount();
