import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { lazy } from "react";

self.MonacoEnvironment = {
	getWorker(_, label) {
		if (label === "json") {
			return new jsonWorker();
		} else if (label === "css" || label === "scss" || label === "less") {
			return new cssWorker();
		} else if (
			label === "html" ||
			label === "handlebars" ||
			label === "razor"
		) {
			return new htmlWorker();
		} else if (label === "typescript" || label === "javascript") {
			return new tsWorker();
		}
		
		return new editorWorker();
	},
};

// Configure Monaco to use local node_modules instead of CDN
loader.config({ monaco });

export const MonacoEditor = lazy(() =>
	import("@monaco-editor/react").then((mod) => ({ default: mod.Editor })),
);

export const MonacoDiffEditor = lazy(() =>
	import("@monaco-editor/react").then((module) => ({
		default: module.DiffEditor,
	})),
);
