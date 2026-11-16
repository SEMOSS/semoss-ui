import { createRoot } from "react-dom/client";
import { Env, Session } from "@semoss/sdk/react";
import { App, i18nReady } from "./app";
import { getDesktopBridge } from "./features/desktop-bridge/desktop-bridge";
import { ServerConnectView } from "./features/server-connection/server-connect-view";
import { Router } from "./pages/router";
import "./index.css";

const mount = async (): Promise<void> => {
	const container = document.getElementById("root");
	if (!container) {
		throw new Error("Root element #root not found");
	}
	const bridge = getDesktopBridge();
	const root = createRoot(container);
	const [server] = await Promise.all([
		bridge.invoke("server-connection:get"),
		i18nReady,
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
