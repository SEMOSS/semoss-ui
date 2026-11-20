import { resolve } from "node:path";
import { createViteConfig } from "@semoss/config";
import { aiSdkStubAlias } from "@semoss/panels/vite";

const root = import.meta.dirname;

// Tests for all three processes. Renderer tests run in jsdom (the shared
// default); main-process and contract tests opt into node per file.
export default createViteConfig({
	rootDir: root,
	enableTailwind: false,
	alias: [
		{
			find: /^monaco-editor$/,
			replacement: resolve(
				root,
				"../../libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
			),
		},
		aiSdkStubAlias,
		{ find: /^@\//, replacement: `${resolve(root, "src/renderer")}/` },
	],
	test: {
		setupFiles: ["./vitest.setup.ts"],
	},
});
