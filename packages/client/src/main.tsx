import { createRoot } from "react-dom/client";
import { Env, Session, waitForEmbedAuth } from "@semoss/sdk/react";
import { App, i18nReady } from "./app";
import { ErrorBoundary } from "./components/common/error-boundary";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
	throw new Error("Root element #root not found");
}
const root = createRoot(container);

// The server writes MODULE into index.html (semoss-env tag, read when the SDK
// loads) and it always wins; .env, then "/Monolith", cover a page without one.
Env.update({
	MODULE: Env.MODULE || import.meta.env.MODULE || "/Monolith",
});

const mount = async () => {
	// Wait for the active language's translations before the first render so
	// shared components don't flash raw i18n keys.
	await Promise.all([waitForEmbedAuth(), i18nReady]);

	// read the config, then the user; the router waits on the session's status.
	// Started before the first render, since the SDK's hooks also start it from
	// their effects and must not read the server before its module is set.
	void Session.initialize();

	root.render(
		// <React.StrictMode>
		<ErrorBoundary
			title="Something went wrong!"
			description="We're working hard to fix it. If the issue
                    persists, please reach out and let us know."
		>
			<App />
		</ErrorBoundary>,
		// </React.StrictMode>,
	);
};

void mount();
