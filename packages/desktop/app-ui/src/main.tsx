import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import { App } from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<ThemeProvider
			defaultTheme="system"
			storageKey="smss-desktop-app-theme"
		>
			<App />
			<Toaster position="top-center" />
		</ThemeProvider>
	</StrictMode>,
);
