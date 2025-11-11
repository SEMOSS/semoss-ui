/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	base: "./",
	plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
	resolve: {
		alias: [
			{ find: "@", replacement: resolve(__dirname, "./src") },
			// Resolve the UI package to source for local development/tests so we don't
			// depend on a built `dist/` folder. This lets imports like
			// `@semoss/ui/next` work against the local `libs/ui/src` sources.
			{
				find: "@semoss/ui/next",
				replacement: resolve(__dirname, "../../libs/ui/src/next"),
			},
			{
				find: "@semoss/ui",
				replacement: resolve(__dirname, "../../libs/ui/src"),
			},
		],
	},
	optimizeDeps: {
		esbuildOptions: {
			target: "es2020",
		},
	},
	test: {
		name: "playground",
		environment: "jsdom",
		globals: true,
		setupFiles: "./vitest.setup.ts",
		reporters: ["default"],
		pool: "vmForks",
		testTimeout: 10000, // Set global timeout to 10 seconds
		hookTimeout: 10000,
		api: {
			port: 5174,
			host: "localhost",
		},
		coverage: {
			enabled: false,
			provider: "v8",
			reporter: ["text"],
			reportOnFailure: true,
			reportsDirectory: "./coverage/packages/playground",
			include: ["**/src/components"],
			exclude: ["**/node_modules", "**/dist"],
		},
		deps: {
			// Force these packages to be processed by Vite instead of Node
			optimizer: {
				web: {
					include: ["vitest-canvas-mock"],
				},
			},
		},
		browser: {
			enabled: false,
			instances: [{ browser: "chromium" }],
			provider: playwright(),
		},
	},
});
