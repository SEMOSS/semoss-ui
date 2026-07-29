import React from "react";
import ReactDOM from "react-dom/client";
import "@/styles/globals.css";
import { LoadingScreen, Toaster } from "@semoss/ui/next";
import PanelApp from "./PanelApp";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<LoadingScreen>
			<PanelApp />
			<Toaster position="top-right" duration={3000} />
		</LoadingScreen>
	</React.StrictMode>,
);
