import { createRoot } from "react-dom/client";
import { waitForEmbedAuth } from "@semoss/sdk/react";
import { App, i18nReady } from "./App";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

const mount = async () => {
	// Wait for the active language's translations before the first render so
	// shared components don't flash raw i18n keys.
	await Promise.all([waitForEmbedAuth(), i18nReady]);

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
