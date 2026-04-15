// import { loader } from "@monaco-editor/react";
// import { lazy } from "react";

async function getMonacoAndLoader() {
	const [monaco, monacoReact] = await Promise.all([
		import("monaco-editor"),
		import("@monaco-editor/react"),
	]);
	// monacoReact.loader is available here
	return {
		monaco,
		loader: monacoReact.loader,
	};
}

// Dynamically set up MonacoEnvironment with async worker loading
if (typeof self !== "undefined") {
	self.MonacoEnvironment = {
		getWorker: async (_: unknown, label: string) => {
			// await loadMonacoLanguage(label);
			if (label === "json") {
				return new (
					await import(
						"monaco-editor/esm/vs/language/json/json.worker?worker"
					)
				).default();
			}
			if (label === "css" || label === "scss" || label === "less") {
				return new (
					await import(
						"monaco-editor/esm/vs/language/css/css.worker?worker"
					)
				).default();
			}
			if (
				label === "html" ||
				label === "handlebars" ||
				label === "razor"
			) {
				return new (
					await import(
						"monaco-editor/esm/vs/language/html/html.worker?worker"
					)
				).default();
			}
			if (label === "typescript" || label === "javascript") {
				return new (
					await import(
						"monaco-editor/esm/vs/language/typescript/ts.worker?worker"
					)
				).default();
			}
			return new (
				await import("monaco-editor/esm/vs/editor/editor.worker?worker")
			).default();
		},
	};
}

// Configure Monaco to use local node_modules instead of CDN
getMonacoAndLoader().then(({ monaco, loader }) => {
	// use monaco and loader
	loader.config({ monaco });
});

export const MonacoEditor = import("@monaco-editor/react").then((mod) => ({
	default: mod.Editor,
}));

export const MonacoDiffEditor = import("@monaco-editor/react").then(
	(module) => ({ default: module.DiffEditor }),
);
