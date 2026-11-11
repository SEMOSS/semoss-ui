import { createRoot } from "react-dom/client";
import { Session, waitForEmbedAuth } from "@semoss/sdk/react";
import { App, i18nReady } from "./app";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
	throw new Error("Root element #root not found");
}
const root = createRoot(container);

const mount = async () => {
	// Wait for the active language's translations before the first render.
	await Promise.all([waitForEmbedAuth(), i18nReady]);

	// Read the config, then the user; the router waits on the session's
	// status. Started before the first render, after `app.tsx` has set the
	// module, so the SDK's hooks never read the server without it.
	void Session.initialize();

	root.render(<App />);
};

void mount();
