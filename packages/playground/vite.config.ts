import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const isProduction = mode === "production";

	const MODULE = env.MODULE;
	const ENDPOINT = env.ENDPOINT;

	// Merge VITE_THEME from .env with theme.local.json overrides (local wins)
	let mergedTheme: Record<string, unknown> = {};
	try {
		mergedTheme = JSON.parse(env.VITE_THEME || "{}");
	} catch (_e) {}
	const themeLocalPath = resolve(__dirname, "./theme.local.json");
	if (existsSync(themeLocalPath)) {
		try {
			const localTheme = JSON.parse(
				readFileSync(themeLocalPath, "utf-8"),
			);
			mergedTheme = { ...mergedTheme, ...localTheme };
		} catch (_e) {}
	}
	return {
		base: "./",
		plugins: [
			tailwindcss(),
			svgr(),
			react({ include: /\.(js|jsx|ts|tsx)$/ }),
		],
		resolve: {
			alias: [{ find: "@", replacement: resolve(__dirname, "./src") }],
		},
		define: {
			"import.meta.env.MODULE": JSON.stringify(MODULE),
			"import.meta.env.ACCESS_KEY": isProduction
				? undefined
				: JSON.stringify(env.ACCESS_KEY),
			"import.meta.env.SECRET_KEY": isProduction
				? undefined
				: JSON.stringify(env.SECRET_KEY),
			"import.meta.env.VITE_THEME": JSON.stringify(
				JSON.stringify(mergedTheme),
			),
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
		server: {
			port: 5174,
			proxy: {
				[MODULE]: {
					target: ENDPOINT,
					changeOrigin: true,
					secure: false,
					preserveHeaderKeyCase: true,
				},
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
	};
});
