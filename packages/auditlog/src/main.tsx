import { createRoot } from "react-dom/client";
import { Session } from "@semoss/sdk/react";
import "./index.css";
import { App, i18nReady } from "./app";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const container = document.getElementById("root");
const root = createRoot(container);

// Wait for the active language's translations before the first render so the
// initial paint shows real copy instead of raw i18n keys.
const mount = async () => {
	await i18nReady;

	// read the config, then the user; the routes wait on the session's status.
	// Started after app.tsx set the module and before the first render, since
	// the SDK's hooks would otherwise start it from their effects.
	void Session.initialize();

	root.render(
		<ErrorBoundary
			title="Something went wrong!"
			description="We're working hard to fix it. If the issue
                      persists, please reach out and let us know."
		>
			<App />
		</ErrorBoundary>,
	);
};

mount();
