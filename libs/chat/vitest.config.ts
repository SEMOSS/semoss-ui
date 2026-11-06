import { resolve } from "node:path";
import { createViteConfig } from "@semoss/config";
import { aiSdkStubAlias } from "@semoss/panels/vite";

// The tests render the shared file panels, which pull the Monaco editor's
// language workers through `?worker` imports that only resolve against the
// real package, so the tests alias the bare specifier the way every host
// that renders a file panel does.
const monacoApi = resolve(
	import.meta.dirname,
	"../shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

// Source-exported package: no build step, so this config exists only to run
// the chat's own tests under the shared SEMOSS vitest defaults.
export default createViteConfig({
	rootDir: import.meta.dirname,
	enableTailwind: false,
	alias: [
		{ find: /^monaco-editor$/, replacement: monacoApi },
		aiSdkStubAlias,
	],
	test: {
		setupFiles: "./vitest.setup.ts",
	},
});
