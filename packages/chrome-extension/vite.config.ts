import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.json";

export default defineConfig({
	plugins: [
		react(),
		crx({ manifest }),
	],
	resolve: {
		alias: {
			"@semoss/ui": resolve(__dirname, "../../libs/ui/src/index.ts"),
			"@semoss/sdk": resolve(__dirname, "../../libs/sdk/src/index.ts"),
			"@semoss/shared": resolve(__dirname, "../../libs/shared/src/index.ts"),
		},
	},
	build: {
		outDir: "build",
		sourcemap: true,
	},
	server: {
		port: 5174,
		strictPort: true,
		hmr: {
			port: 5174,
		},
	},
});
