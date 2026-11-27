import { defineConfig } from "electron-vite";
import { resolve } from "node:path";
// electron-vite bundles this file but leaves packages external, and Node cannot
// run the workspace's TypeScript sources itself (unlike `vite --configLoader
// runner`). Importing them by path lets electron-vite bundle them in.
import {
	createViteConfig,
	localeManualChunks,
} from "../../libs/config/src/index";
import {
	aiSdkStubAlias,
	scopePptxViewerCssPlugin,
} from "../../libs/panels/src/vite/index";

const root = import.meta.dirname;

const monacoApi = resolve(
	root,
	"../../libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

// The renderer is a SEMOSS web app like the playground: the shared config plus
// the host wiring every dock host needs. `@/` is the renderer's own source.
const renderer = createViteConfig({
	rootDir: root,
	port: 5181,
	enableSvgr: true,
	alias: [
		{ find: /^monaco-editor$/, replacement: monacoApi },
		// bundled into this config, the alias's own `import.meta.dirname` would
		// point here, so name the stub's real path
		{
			...aiSdkStubAlias,
			replacement: resolve(
				root,
				"../../libs/panels/src/vite/ai-sdk-stub.ts",
			),
		},
		{ find: /^@\//, replacement: `${resolve(root, "src/renderer")}/` },
	],
	manualChunks: localeManualChunks,
});

export default defineConfig((env) => {
	const rendererConfig = renderer(env);
	return {
		main: {
			build: { lib: { entry: resolve(root, "src/main/main.ts") } },
		},
		preload: {
			build: { lib: { entry: resolve(root, "src/preload/preload.ts") } },
		},
		renderer: {
			...rendererConfig,
			// The page reaches the dev server through the app's own origin, so
			// it needs no CORS; Vite's default allows any localhost origin,
			// tool views on tools.localhost included, to read workspace files.
			server: { ...rendererConfig.server, cors: false },
			root: resolve(root, "src/renderer"),
			// the playground's .env, so both apps build with the same theme and
			// new-chat defaults (its VITE_ values only; the desktop has its own servers)
			envDir: resolve(root, "../playground"),
			plugins: [
				scopePptxViewerCssPlugin,
				...(rendererConfig.plugins ?? []),
			],
			build: {
				...rendererConfig.build,
				outDir: resolve(root, "out/renderer"),
			},
		},
	};
});
