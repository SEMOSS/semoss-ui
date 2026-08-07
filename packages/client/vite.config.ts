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

export default createViteConfig({
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
