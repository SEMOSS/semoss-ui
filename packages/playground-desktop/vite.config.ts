import type { ConfigEnv } from "vite";
import { resolve } from "node:path";
import {
	createViteConfig,
	DEV_SERVER_PORTS,
	localeManualChunks,
} from "@semoss/config";
import { aiSdkStubAlias, scopePptxViewerCssPlugin } from "@semoss/panels/vite";

const monacoApi = resolve(
	import.meta.dirname,
	"../../libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

// The desktop app talks to the instance the user picks through the native
// bridge, so its dev server needs no backend proxy.
const baseConfig = createViteConfig({
	rootDir: import.meta.dirname,
	port: DEV_SERVER_PORTS.playgroundDesktop,
	alias: [
		{ find: /^monaco-editor$/, replacement: monacoApi },
		aiSdkStubAlias,
	],
	manualChunks: localeManualChunks,
	test: {
		setupFiles: "./vitest.setup.ts",
	},
});

export default (env: ConfigEnv) => {
	const config = baseConfig(env);
	config.plugins = [scopePptxViewerCssPlugin, ...(config.plugins ?? [])];
	// Tauri serves the built app from its own scheme, so assets resolve
	// relative to the page.
	config.base = "./";
	config.clearScreen = false;
	return config;
};
