import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { logError } from "./platform/logger";
import "./styles.css";

window.addEventListener("error", (event) => {
	logError(`Unhandled window error: ${event.message || "Unknown error"}`);
});

window.addEventListener("unhandledrejection", (event) => {
	const reason =
		event.reason instanceof Error
			? event.reason.message
			: String(event.reason ?? "Unknown rejection");
	logError(`Unhandled promise rejection: ${reason}`);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
