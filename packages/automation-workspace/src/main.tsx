import React from "react";
import ReactDOM from "react-dom/client";
import { InsightProvider } from "@semoss/sdk/react";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
	throw new Error(
		"The root element is required to start the Automation Workspace.",
	);
}

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<InsightProvider>
			<ThemeProvider
				defaultTheme="light"
				storageKey="automation-workspace-theme"
			>
				<App />
				<Toaster />
			</ThemeProvider>
		</InsightProvider>
	</React.StrictMode>,
);
