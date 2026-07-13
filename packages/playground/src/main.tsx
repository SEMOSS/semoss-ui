import { createRoot } from "react-dom/client";
import { waitForEmbedAuth } from "@semoss/sdk/react";
import { App, i18nReady } from "./app";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container); // createRoot(container!) if you use TypeScript

const mount = async () => {
	// Wait for the active language's translations before the first render.
	await Promise.all([waitForEmbedAuth(), i18nReady]);
	root.render(<App />);
};

void mount();
