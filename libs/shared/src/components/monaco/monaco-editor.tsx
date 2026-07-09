/// <reference path="../../vite-env.d.ts" />
import { createElement, lazy } from "react";

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
				import("monaco-editor/esm/vs/editor/editor.main"),
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

// Wrap the @monaco-editor/react Editor so its wrapper div always renders with
// `dir="ltr"`. Monaco assumes left-to-right for code (the textarea, line
// numbers, completion popups, hit-testing of mouse clicks all break under
// `dir="rtl"`). Forcing LTR at the wrapper keeps the editor usable inside an
// RTL page (Arabic/Hebrew). Callers can still override via `wrapperProps`.
type EditorProps = React.ComponentProps<MonacoReactModule["Editor"]>;
type DiffEditorProps = React.ComponentProps<MonacoReactModule["DiffEditor"]>;

const withLtrWrapper = <P extends { wrapperProps?: object }>(
	Component: React.ComponentType<P>,
) => {
	const Wrapped: React.FC<P> = (props) =>
		createElement(Component, {
			...props,
			wrapperProps: {
				dir: "ltr",
				...((props.wrapperProps ?? {}) as Record<string, unknown>),
			},
		});
	Wrapped.displayName = `WithLtr(${Component.displayName ?? Component.name ?? "Component"})`;
	return Wrapped;
};

export const MonacoEditor = lazy(() =>
	ensureMonacoSetup()
		.then(() => loadMonacoReact())
		.then((mod) => ({
			default: withLtrWrapper<EditorProps>(mod.Editor),
		})),
);

export const MonacoDiffEditor = lazy(() =>
	ensureMonacoSetup()
		.then(() => loadMonacoReact())
		.then((mod) => ({
			default: withLtrWrapper<DiffEditorProps>(mod.DiffEditor),
		})),
);
