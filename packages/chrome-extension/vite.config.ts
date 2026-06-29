import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";
import manifest from "./src/manifest.json";

export default defineConfig({
	plugins: [react(), crx({ manifest })],
	resolve: {
		alias: {
			"@": resolve(__dirname, "../../libs/ui/src"),
			"@semoss/ui/next": resolve(
				__dirname,
				"../../libs/ui/src/next/index.ts",
			),
			"@semoss/sdk": resolve(__dirname, "../../libs/sdk/src/index.ts"),
			"@semoss/shared": resolve(
				__dirname,
				"../../libs/shared/src/index.ts",
			),
		},
	},
	build: {
		outDir: "build",
		sourcemap: true,
		rollupOptions: {
			input: {
				panel: resolve(__dirname, "src/panel/index.html"),
			},
		},
	},
	server: {
		port: 5174,
		strictPort: true,
		hmr: {
			port: 5174,
		},
	},
});
