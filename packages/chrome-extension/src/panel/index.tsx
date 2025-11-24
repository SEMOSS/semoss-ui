import React from "react";
import ReactDOM from "react-dom/client";
import PanelApp from "./PanelApp";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<PanelApp />
	</React.StrictMode>,
);
