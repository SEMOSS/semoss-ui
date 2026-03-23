/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
	base: "./",
	plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
	resolve: {
		alias: [
			{
				find: "@/lib/utils",
				replacement: resolve(__dirname, "../ui/src/lib/utils.ts"),
			},
			{
				find: "@/next",
				replacement: resolve(__dirname, "../ui/src/next"),
			},
			{
				find: "@/hooks/use-mobile",
				replacement: resolve(__dirname, "../ui/src/hooks"),
			},
			{
				find: "@",
				replacement: resolve(__dirname, "./src"),
			},
			{
				find: "@semoss/ui",
				replacement: resolve(__dirname, "../ui/src"),
			},
			{
				find: /^monaco-editor$/,
				replacement: resolve(
					__dirname,
					"../shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
				),
			},
		],
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
		name: "renderer",
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		reporters: ["default"],
		pool: "vmForks",
		testTimeout: 10000, // Set global timeout to 10 seconds
		hookTimeout: 10000,
		coverage: {
			enabled: false,
			provider: "v8",
			reporter: ["text"],
			reportOnFailure: true,
			reportsDirectory: "./coverage/packages/renderer",
			include: ["**/src/components"],
			exclude: ["**/node_modules", "**/dist"],
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
						/^vega-/, // This catches any vega-* packages
					],
				},
			},
			external: ["@semoss/ui", "@semoss/sdk"],
			//helps Vitest handle CommonJS/ES module interoperability
			interopDefault: true,
		},
		browser: {
			enabled: false,
			instances: [{ browser: "chromium" }],
			provider: playwright(),
		},
	},
});
