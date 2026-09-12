import React from "react";
import ReactDOM from "react-dom/client";
import { clientResources, I18nBuilder, I18nextProvider } from "@semoss/i18n";
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

const i18nBuilder = new I18nBuilder(clientResources);

const app = (
	<React.StrictMode>
		<InsightProvider>
			<ThemeProvider
				defaultTheme="light"
				storageKey="automation-workspace-theme"
			>
				<I18nextProvider i18n={i18nBuilder.i18n}>
					<App />
				</I18nextProvider>
				<Toaster />
			</ThemeProvider>
		</InsightProvider>
	</React.StrictMode>
);

void i18nBuilder.ready.finally(() => {
	ReactDOM.createRoot(root).render(app);
});
