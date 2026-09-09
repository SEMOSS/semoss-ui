import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import postcss from "postcss";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { resolve } from "node:path";

const PPTX_VIEWER_SCOPE = ".pptx-viewer-scope";

/**
 * Confine pptx-react-viewer's stylesheet to its mount point. Its Tailwind
 * build emits the same utility class names and layer names as the app's own
 * Tailwind build (e.g. `.border-border`), compiled against `--color-*` tokens
 * it defines on `:root` — whichever stylesheet loads last would restyle the
 * whole document. Prefixing every selector pins its rules (and its tokens,
 * whose `:root`/`html` blocks become the scope element itself) to the viewer
 * subtree, and the +1 specificity lets them beat the app's same-named
 * utilities inside it.
 */
const scopePptxViewerCss = (code: string): string => {
	const sheet = postcss.parse(code);
	sheet.walkRules((rule) => {
		const parent = rule.parent;
		if (
			parent?.type === "atrule" &&
			/keyframes/i.test((parent as postcss.AtRule).name)
		) {
			return;
		}
		rule.selectors = rule.selectors.map((selector) => {
			const trimmed = selector.trim();
			const rehomed = trimmed.replace(
				/^(:root|:host|html)(?![\w-])/,
				PPTX_VIEWER_SCOPE,
			);
			if (rehomed !== trimmed) {
				return rehomed;
			}
			return `${PPTX_VIEWER_SCOPE} ${trimmed}`;
		});
	});
	return sheet.toString();
};

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const isProduction = mode === "production";

	const MODULE = env.MODULE;
	const ENDPOINT = env.ENDPOINT;

	return {
		base: "./",
		plugins: [
			{
				// See scopePptxViewerCss — the scope class is applied by
				// file-pptx-viewer-content.tsx around the viewer mount.
				name: "scope-pptx-viewer-css",
				transform(code: string, id: string) {
					if (
						!id.includes("pptx-react-viewer") ||
						!id.split("?")[0].endsWith(".css")
					) {
						return null;
					}
					return { code: scopePptxViewerCss(code), map: null };
				},
			},
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
					find: /^monaco-editor$/,
					replacement: resolve(
						__dirname,
						"../../libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
					),
				},
				{
					// Optional peer of pptx-react-viewer (AI chat panel, unused
					// here); stubbed so Rollup can resolve its named imports.
					find: /^ai$/,
					replacement: resolve(
						__dirname,
						"./src/utility/ai-sdk-stub.ts",
					),
				},
			],
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
						// Group each language's translation JSON into a single
						// lazy chunk so loading/switching a language is one request
						// and new languages never bloat the main bundle.
						const locale = id.match(/\/locales\/([^/]+)\/.*\.json/);
						if (locale) {
							return `locale-${locale[1]}`;
						}
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
					},
				},
			},
		},
		server: {
			port: 5173,
			allowedHosts: [".ngrok-free.dev", ".pinggy-free.link"],
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
