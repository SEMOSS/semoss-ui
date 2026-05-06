import { lazy } from "react";

type MonacoReactModule = typeof import("@monaco-editor/react");

type MonacoEnvironment = {
	getWorker: (_moduleId: unknown, label: string) => Worker;
};

let monacoReactModulePromise: Promise<MonacoReactModule> | null = null;
let monacoSetupPromise: Promise<void> | null = null;

const loadMonacoReact = () => {
	if (!monacoReactModulePromise) {
		monacoReactModulePromise = import("@monaco-editor/react");
	}

	return monacoReactModulePromise;
};

const ensureMonacoSetup = async () => {
	if (!monacoSetupPromise) {
		monacoSetupPromise = (async () => {
			const [
				monacoReactModule,
				monaco,
				editorWorkerModule,
				cssWorkerModule,
				htmlWorkerModule,
				jsonWorkerModule,
				tsWorkerModule,
			] = await Promise.all([
				loadMonacoReact(),
				import("monaco-editor"),
				import("monaco-editor/esm/vs/editor/editor.worker?worker"),
				import("monaco-editor/esm/vs/language/css/css.worker?worker"),
				import("monaco-editor/esm/vs/language/html/html.worker?worker"),
				import("monaco-editor/esm/vs/language/json/json.worker?worker"),
				import(
					"monaco-editor/esm/vs/language/typescript/ts.worker?worker"
				),
			]);

			const monacoGlobal = globalThis as typeof globalThis & {
				MonacoEnvironment?: MonacoEnvironment;
			};

			monacoGlobal.MonacoEnvironment = {
				getWorker: (_moduleId, label) => {
					if (label === "json") {
						return new jsonWorkerModule.default();
					}
					if (
						label === "css" ||
						label === "scss" ||
						label === "less"
					) {
						return new cssWorkerModule.default();
					}
					if (
						label === "html" ||
						label === "handlebars" ||
						label === "razor"
					) {
						return new htmlWorkerModule.default();
					}
					if (label === "typescript" || label === "javascript") {
						return new tsWorkerModule.default();
					}

					return new editorWorkerModule.default();
				},
			};

			// Configure Monaco to use local node_modules instead of CDN.
			monacoReactModule.loader.config({ monaco });
		})();
	}

	return monacoSetupPromise;
};

export const MonacoEditor = lazy(() =>
	ensureMonacoSetup()
		.then(() => loadMonacoReact())
		.then((mod) => ({ default: mod.Editor })),
);

export const MonacoDiffEditor = lazy(() =>
	ensureMonacoSetup()
		.then(() => loadMonacoReact())
		.then((mod) => ({ default: mod.DiffEditor })),
);
