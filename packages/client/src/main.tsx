import { createRoot } from "react-dom/client";
import { waitForEmbedAuth } from "@semoss/sdk/react";
import { App } from "./App";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container);

const mount = async () => {
	await waitForEmbedAuth();

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
