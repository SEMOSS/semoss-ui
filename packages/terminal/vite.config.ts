import type { ConfigEnv } from "vite";
import { resolve } from "node:path";
import {
	createViteConfig,
	DEV_SERVER_PORTS,
	localeManualChunks,
} from "@semoss/config";
import { aiSdkStubAlias, scopePptxViewerCssPlugin } from "@semoss/panels/vite";

// The Monaco editor pulls its language workers through `?worker` imports that
// only resolve against the real package.
const monacoApi = resolve(
	import.meta.dirname,
	"../../libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

const baseConfig = createViteConfig({
	rootDir: import.meta.dirname,
	port: DEV_SERVER_PORTS.terminal,
	alias: [
		{ find: /^monaco-editor$/, replacement: monacoApi },
		aiSdkStubAlias,
	],
	manualChunks: localeManualChunks,
	define: (env, isProduction) => ({
		"import.meta.env.ACCESS_KEY": isProduction
			? undefined
			: JSON.stringify(env.ACCESS_KEY),
		"import.meta.env.SECRET_KEY": isProduction
			? undefined
			: JSON.stringify(env.SECRET_KEY),
	}),
});

export default (env: ConfigEnv) => {
	const config = baseConfig(env);
	config.plugins = [scopePptxViewerCssPlugin, ...(config.plugins ?? [])];
	return config;
};
