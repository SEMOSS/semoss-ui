import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const rootDir = dirname(fileURLToPath(import.meta.url));

	const isProduction = mode === "production";

	const MODULE = env.MODULE;
	const ENDPOINT = env.ENDPOINT;

	return {
		base: "./",
		plugins: [
			tailwindcss(),
			svgr(),
			react({ include: /\.(js|jsx|ts|tsx)$/ }),
		],
		resolve: {
			alias: [{ find: "@", replacement: resolve(rootDir, "./src") }],
		},
		define: {
			"import.meta.env.MODULE": JSON.stringify(MODULE),
		},
		build: {
			minify: isProduction,
			commonjsOptions: { transformMixedEsModules: true },
		},
		server: {
			port: 5175,
			proxy: {
				[MODULE]: {
					target: ENDPOINT,
					changeOrigin: true,
					secure: false,
					preserveHeaderKeyCase: true,
				},
			},
		},
		// test: {
		//   environment: "jsdom",
		//   globals: true,
		//   setupFiles: ["./vitest.setup.ts"],
		// },
	};
});
