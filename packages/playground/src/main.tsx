import { createRoot } from "react-dom/client";
import { waitForEmbedAuth } from "@semoss/sdk/react";
import { App } from "./app";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container); // createRoot(container!) if you use TypeScript

const mount = async () => {
	await waitForEmbedAuth();
	root.render(<App />);
};

void mount();
