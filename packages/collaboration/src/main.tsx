import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Session } from "@semoss/sdk/react";
import "./index.css";
import { App } from "./app";
import { applyTypeface } from "./lib/typeface";

// before the first paint so the page does not flash in the other font
applyTypeface();

// read the config, then the user; the routes wait on the session's status.
// Started after app.tsx set the module and before the first render, since the
// SDK's hooks would otherwise start it from their effects.
void Session.initialize();

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}
createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
