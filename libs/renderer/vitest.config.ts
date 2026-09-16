import { resolve } from "node:path";
import { createViteConfig } from "@semoss/config";

const uiSrc = resolve(import.meta.dirname, "../ui/src");
const monacoApi = resolve(
	import.meta.dirname,
	"../shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

export default createViteConfig({
	rootDir: import.meta.dirname,
	enableTailwind: false,
	alias: [
		{ find: "@/lib/utils", replacement: resolve(uiSrc, "lib/utils.ts") },
		{ find: "@/next", replacement: resolve(uiSrc, "next") },
		{ find: "@/hooks/use-mobile", replacement: resolve(uiSrc, "hooks") },
		{
			find: "@semoss/ui/next",
			replacement: resolve(uiSrc, "next/index.ts"),
		},
		{ find: /^monaco-editor$/, replacement: monacoApi },
	],
	optimizeDeps: {
		// Pre-bundle these packages to avoid runtime issues
		include: ["vega", "vega-lite", "vega-embed", "react-vega"],
	},
	test: {
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			reportsDirectory: "./coverage/packages/renderer",
			include: ["**/src/components"],
		},
		deps: {
			// Force these packages to be processed by Vite instead of Node
			optimizer: {
				web: {
					include: [
						"vitest-canvas-mock",
						"vega",
						"vega-lite",
						"vega-embed",
						"react-vega",
					],
				},
			},
			//helps Vitest handle CommonJS/ES module interoperability
			interopDefault: true,
		},
		server: {
			deps: {
				external: ["@semoss/ui/next", "@semoss/sdk"],
			},
		},
	},
});
