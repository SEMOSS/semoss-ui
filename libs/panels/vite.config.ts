import { resolve } from "node:path";
import { createViteConfig } from "@semoss/config";

// The Monaco editor pulls its language workers through `?worker` imports that
// only resolve against the real package. Every host that renders a file panel
// aliases the bare specifier the same way; the tests need it too.
const monacoApi = resolve(
	import.meta.dirname,
	"../shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

// Source-exported package: no build step, so this config exists only to run
// the panels' own tests under the shared SEMOSS vitest defaults.
export default createViteConfig({
	rootDir: import.meta.dirname,
	enableTailwind: false,
	alias: [{ find: /^monaco-editor$/, replacement: monacoApi }],
	test: {
		setupFiles: ["./vitest.setup.ts"],
	},
});
