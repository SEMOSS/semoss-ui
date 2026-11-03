import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app";
import { applyTypeface } from "./lib/typeface";

// before the first paint so the page does not flash in the other font
applyTypeface();

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}
createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
