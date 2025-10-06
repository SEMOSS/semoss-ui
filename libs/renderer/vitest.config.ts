/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
	base: "./",
	plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
	resolve: {
		alias: [{ find: "@", replacement: resolve(__dirname, "./src") }],
	},
	build: {
		minify: isProduction,
		commonjsOptions: { transformMixedEsModules: true },
	},
	optimizeDeps: {
		// Pre-bundle these packages to avoid runtime issues
		include: ["vega", "vega-lite", "vega-embed", "react-vega"],
		esbuildOptions: {
			target: "es2020",
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		reporters: ["default"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			reportsDirectory: "./coverage/packages/renderer",
			// thresholds: {
			//     statements: 60,
			//     functions: 60,
			//     branches: 60,
			//     lines: 60,
			// },
		},
		deps: {
			// Force these packages to be processed by Vite instead of Node
			inline: [
				"vega",
				"vega-lite",
				"vega-embed",
				"react-vega",
				/^vega-/, // This catches any vega-* packages
			],
		},
	},
});
