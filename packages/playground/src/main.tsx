import { createRoot } from "react-dom/client";
import { Session } from "@semoss/sdk";
import { waitForEmbedAuth } from "@semoss/sdk/react";
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
	// Read the config and the signed in user once for the whole page; the
	// layouts gate on `useConfig` and `useSession`.
	void Session.initialize();
	root.render(<App />);
};

void mount();
