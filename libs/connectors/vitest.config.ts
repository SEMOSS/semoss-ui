import { resolve } from "node:path";
import { createViteConfig } from "@semoss/config";

// The drive viewers render the shared file explorer, which pulls the Monaco
// editor's language workers through `?worker` imports that only resolve
// against the real package, so the tests alias the bare specifier the way
// every host that renders a file panel does.
const monacoApi = resolve(
	import.meta.dirname,
	"../shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

// Source-exported package: no build step, so this config exists only to run
// the connectors' own tests under the shared SEMOSS vitest defaults.
export default createViteConfig({
	rootDir: import.meta.dirname,
	enableTailwind: false,
	alias: [{ find: /^monaco-editor$/, replacement: monacoApi }],
});
