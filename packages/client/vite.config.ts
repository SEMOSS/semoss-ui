import postcss from "postcss";
import type { ConfigEnv, Plugin } from "vite";
import { resolve } from "node:path";
import {
	createViteConfig,
	DEV_SERVER_PORTS,
	localeManualChunks,
} from "@semoss/config";

const sharedAssets = resolve(
	import.meta.dirname,
	"../../libs/shared/src/assets",
);
const monacoApi = resolve(
	import.meta.dirname,
	"../../libs/shared/node_modules/monaco-editor/esm/vs/editor/editor.api",
);

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

const scopePptxViewerCssPlugin: Plugin = {
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
};

const baseConfig = createViteConfig({
	rootDir: import.meta.dirname,
	port: DEV_SERVER_PORTS.client,
	enableSvgr: true,
	proxy: { ws: true },
	alias: [
		{
			find: /^@\/assets\/img\//,
			replacement: `${resolve(sharedAssets, "img")}/`,
		},
		{
			find: /^@\/assets\/loginProviders\//,
			replacement: `${resolve(sharedAssets, "loginProviders")}/`,
		},
		{ find: /^monaco-editor$/, replacement: monacoApi },
		{
			// Optional peer of pptx-react-viewer (AI chat panel, unused
			// here); stubbed so the bundler can resolve its named imports.
			find: /^ai$/,
			replacement: resolve(
				import.meta.dirname,
				"./src/utility/ai-sdk-stub.ts",
			),
		},
	],
	manualChunks(id) {
		const locale = localeManualChunks(id);
		if (locale) {
			return locale;
		}
		if (id.includes("/src/pages/import/import.constants.ts")) {
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
			id.includes("/src/shared/constants/sidebar-menu.constants.ts")
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
		return undefined;
	},
	test: {
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			reportsDirectory: "./coverage/packages/client",
			include: ["**/src/components"],
		},
		deps: {
			optimizer: {
				web: {
					include: ["vitest-canvas-mock"],
				},
			},
		},
		server: {
			deps: {
				external: ["@semoss/ui/next", "@semoss/sdk"],
			},
		},
	},
});

export default (env: ConfigEnv) => {
	const config = baseConfig(env);
	config.plugins = [scopePptxViewerCssPlugin, ...(config.plugins ?? [])];
	return config;
};
