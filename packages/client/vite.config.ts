import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
	// To analyze the bundle: uncomment the visualizer import + plugin below,
	// run `pnpm build:dev`, then inspect dist/stats.html with analyze-bundle.mjs.
	// const { visualizer } = await import("rollup-plugin-visualizer");
	const env = loadEnv(mode, process.cwd(), "");

	const isProduction = mode === "production";

	const MODULE = env.MODULE;
	const ENDPOINT = env.ENDPOINT;

	return {
		base: "./",
		plugins: [
			tailwindcss(),
			svgr(),
			react({ include: /\.(js|jsx|ts|tsx)$/ }),
			// visualizer({ open: true, filename: "dist/stats.html", gzipSize: true }),
		],
		resolve: {
			alias: [
				{
					find: /^@\/assets\/img\//,
					replacement: `${resolve(__dirname, "../../libs/shared/src/assets/img")}/`,
				},
				{
					find: /^@\/assets\/loginProviders\//,
					replacement: `${resolve(__dirname, "../../libs/shared/src/assets/loginProviders")}/`,
				},

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
					manualChunks(id: string) {
						if (
							id.includes("/src/pages/import/import.constants.ts")
						) {
							return "import-constants";
						}
						if (
							id.includes(
								"/src/components/import/model/model-import.constants.ts",
							)
						) {
							return "model-import-constants";
						}
						if (
							id.includes(
								"/libs/shared/src/constants/engine-images.constants.ts",
							) ||
							id.includes(
								"/src/shared/constants/sidebar-menu.constants.ts",
							)
						) {
							return "icon-assets";
						}
						if (id.includes("/node_modules/flexlayout-react/")) {
							return "vendor-flexlayout";
						}
						if (
							id.includes("/node_modules/@xyflow/react/") ||
							id.includes("/node_modules/@xyflow/system/")
						) {
							return "vendor-xyflow";
						}
						if (
							id.includes("/node_modules/react/") ||
							id.includes("/node_modules/react-dom/") ||
							id.includes("/node_modules/scheduler/")
						) {
							return "vendor-react";
						}
						if (
							id.includes("/node_modules/react-router") ||
							id.includes("/node_modules/@remix-run/")
						) {
							return "vendor-react-router";
						}
						if (
							id.includes("/node_modules/mobx/") ||
							id.includes("/node_modules/mobx-react-lite/")
						) {
							return "vendor-mobx";
						}
						if (
							id.includes("/node_modules/@mui/") ||
							id.includes("/node_modules/@emotion/")
						) {
							return "vendor-mui";
						}
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
					ws: true,
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
				external: ["@semoss/ui/next", "@semoss/sdk"],
			},
			browser: {
				enabled: false,
				instances: [{ browser: "chromium" }],
				provider: playwright(),
			},
		},
	};
});
