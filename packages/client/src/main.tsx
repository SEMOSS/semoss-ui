import { createRoot } from "react-dom/client";
import { Env, Session, waitForEmbedAuth } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import { App, i18nReady } from "./app";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
	throw new Error("Root element #root not found");
}
const root = createRoot(container);

/**
 * Point the SDK at the server: the build's module, or the one the page names
 * in its `semoss-env` script in production.
 */
const loadEnv = (): void => {
	Env.update({
		MODULE: import.meta.env.MODULE || "/Monolith",
	});

	const text = document.getElementById("semoss-env")?.textContent;
	if (!text) {
		return;
	}

	try {
		const env: unknown = JSON.parse(text);
		if (isRecord(env) && typeof env.MODULE === "string") {
			Env.update({
				MODULE: env.MODULE,
			});
		}
	} catch {
		// a malformed script keeps the build's module
	}
};

const mount = async () => {
	loadEnv();

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
