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

	// Load theme from theme.local.json if present, otherwise fall back to VITE_THEME in .env.local
	const themeFile = resolve(__dirname, "theme.local.json");
	const THEME = existsSync(themeFile)
		? readFileSync(themeFile, "utf-8").trim()
		: env.VITE_THEME || "{}";

	return {
		base: "./",
		plugins: [
			tailwindcss(),
			svgr(),
			react({ include: /\.(js|jsx|ts|tsx)$/ }),
		],
		resolve: {
			alias: [
				{ find: "@", replacement: resolve(__dirname, "./src") },
				{
					find: "monaco-editor",
					replacement: resolve(
						__dirname,
						"../../libs/shared/node_modules/monaco-editor",
					),
				},
			],
			dedupe: ["react", "react-dom", "monaco-editor"],
		},
		define: {
			"import.meta.env.MODULE": JSON.stringify(MODULE),
			"import.meta.env.ACCESS_KEY": isProduction
				? undefined
				: JSON.stringify(env.ACCESS_KEY),
			"import.meta.env.SECRET_KEY": isProduction
				? undefined
				: JSON.stringify(env.SECRET_KEY),
			"import.meta.env.VITE_THEME": JSON.stringify(THEME),
		},
		build: {
			minify: isProduction,
			commonjsOptions: { transformMixedEsModules: true },
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes("monaco-editor")) return "monaco";
					},
				},
			},
		},
		optimizeDeps: {
			esbuildOptions: {
				target: "es2020",
			},
			exclude: ["monaco-editor"],
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
