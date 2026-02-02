import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { lazy } from "react";

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
