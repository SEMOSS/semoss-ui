import { defineConfig } from "vite";
import { resolve } from "node:path";
import { aiSdkStubAlias, scopePptxViewerCssPlugin } from "@semoss/panels/vite";
import tailwindcss from "../../../libs/config/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "../../../libs/config/node_modules/@vitejs/plugin-react/dist/index.js";

const fixtureRoot = import.meta.dirname;
const workspaceRoot = resolve(fixtureRoot, "../../..");

export default defineConfig({
	root: fixtureRoot,
	envDir: false,
	envPrefix: "ISOLATED_VISUAL_FIXTURE_",
	plugins: [react(), tailwindcss(), scopePptxViewerCssPlugin],
	resolve: {
		dedupe: ["react", "react-dom"],
		alias: [
			{
				find: /^@semoss\/sdk\/react$/,
				replacement: resolve(fixtureRoot, "sdk-react-fixture.tsx"),
			},
			{
				find: /^@semoss\/sdk$/,
				replacement: resolve(fixtureRoot, "sdk-fixture.ts"),
			},
			{ find: "@", replacement: resolve(fixtureRoot, "../src") },
			{
				find: /^monaco-editor$/,
				replacement: resolve(
					workspaceRoot,
					"libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
				),
			},
			aiSdkStubAlias,
		],
	},
	define: {
		"import.meta.env.MODULE": JSON.stringify("/fixture-disabled"),
		"import.meta.env.ACCESS_KEY": "undefined",
		"import.meta.env.SECRET_KEY": "undefined",
		"import.meta.env.VITE_THEME": JSON.stringify("{}"),
	},
	server: {
		host: "127.0.0.1",
		port: 5187,
		strictPort: true,
		hmr: false,
		fs: { allow: [workspaceRoot] },
	},
});
