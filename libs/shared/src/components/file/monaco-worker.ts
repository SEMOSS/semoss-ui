// Dynamically set up MonacoEnvironment with async worker loading
/*if (typeof self !== "undefined") {
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


// Optionally, set eager model sync for typescript if needed
export async function setEagerModelSync() {
	const monaco = await import("monaco-editor");
	monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
}
*/
