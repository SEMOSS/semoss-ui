/// <reference types="vitest" />

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
	base: "./",
	plugins: [tailwindcss(), svgr(), react({ include: /\.(js|jsx|ts|tsx)$/ })],
	resolve: {
		alias: [{ find: "@", replacement: resolve(__dirname, "./src") }],
	},
	build: {
		minify: isProduction,
		commonjsOptions: { transformMixedEsModules: true },
	},
	optimizeDeps: {
		esbuildOptions: {
			target: "es2020",
		},
	},
	test: {
		name: "client",
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		reporters: ["default"],
		pool: "vmForks",
		testTimeout: 10000,
		hookTimeout: 10000,
		coverage: {
			enabled: false,
			provider: "v8",
			reporter: ["text"],
			reportOnFailure: true,
			reportsDirectory: "./coverage/packages/client",
			include: ["**/src/components"],
			exclude: ["**/node_modules", "**/dist"],
		},
		deps: {
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
