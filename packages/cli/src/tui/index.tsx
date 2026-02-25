import { render } from "ink";
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import React from "react";
import { App } from "./App.js";

export const runTUI = () => {
	render(<App />);
};
