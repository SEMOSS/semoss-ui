import type { Config } from "./types.js";

export const DEFAULT_CONFIG: Config = {
	app: "",
	name: "",
	targets: [],
	ignore: [
		"node_modules/**",
		"**/.git/**",
		"**/*.local",
		"client/**",
		"**/package.json",
		"**/package-lock.json",
		"**/pnpm-lock.yaml",
		"**/vite.config.ts",
		"**/vite.config.js",
		"**/vitest.config.ts",
		"**/vitest.config.js",
		"**/tsconfig.json",
		"**/components.json",
		"target/**",
		"tests/**",
		"test_classes/**",
		"classes/**",
		".semoss-backups/**",
		".semoss-deployments",
		"smss.json",
	],
	deploy: {
		batch: {},
	},
};
