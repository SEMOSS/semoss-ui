import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const isProduction = mode === "production";

	const MODULE = env.MODULE;
	const ENDPOINT = env.ENDPOINT;

	return {
		base: "./",
		plugins: [
			tailwindcss({ optimize: false }),
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
			exclude: ["monaco-editor"],
		},
		server: {
			port: 5173,
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
				external: ["@semoss/ui", "@semoss/sdk"],
			},
			browser: {
				enabled: false,
				instances: [{ browser: "chromium" }],
				provider: playwright(),
			},
		},
	};
});
