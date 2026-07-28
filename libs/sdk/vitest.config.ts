/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	resolve: {
		alias: [
			{
				find: "@",
				replacement: resolve(__dirname, "./src"),
			},
		],
	},
	test: {
		name: "sdk",
		environment: "node",
		globals: true,
		coverage: {
			enabled: false,
			provider: "v8",
			reporter: ["text"],
			reportsDirectory: "./coverage",
			include: ["src/**"],
			exclude: ["**/node_modules", "**/dist"],
		},
	},
});
