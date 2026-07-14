import "./sandbox.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@semoss/ui/next";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) {
	throw new Error("Missing #root element");
}

createRoot(root).render(
	<StrictMode>
		<ThemeProvider
			defaultTheme="light"
			storageKey="semoss-chat-sandbox-theme"
		>
			<App />
		</ThemeProvider>
	</StrictMode>,
);
