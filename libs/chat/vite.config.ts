import { resolve } from "node:path";
import { createViteConfig } from "@semoss/config";
import { aiSdkStubAlias } from "@semoss/panels/vite";

// The Monaco editor pulls its language workers through `?worker` imports that
// only resolve against the real package; hosts alias it the same way.
const monacoApi = resolve(
	import.meta.dirname,
	"../shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

// Source-exported package: no build step, so this config exists only to run
// the chat library's own tests under the shared SEMOSS vitest defaults.
export default createViteConfig({
	rootDir: import.meta.dirname,
	enableTailwind: false,
	alias: [
		{ find: /^monaco-editor$/, replacement: monacoApi },
		aiSdkStubAlias,
	],
	test: {
		setupFiles: ["./vitest.setup.ts"],
	},
});
