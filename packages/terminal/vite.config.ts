import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const isProduction = mode === "production";
	const MODULE = env.MODULE;
	const ENDPOINT = env.ENDPOINT;

	return {
		base: "./",
		plugins: [tailwindcss(), react({ include: /\.(js|jsx|ts|tsx)$/ })],
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
		},
		build: {
			minify: isProduction,
			commonjsOptions: { transformMixedEsModules: true },
			rollupOptions: {
				output: {
					manualChunks(id: string) {
						// One lazy chunk per language so loading/switching a
						// language is a single request and new languages never
						// bloat the main bundle.
						const locale = id.match(/\/locales\/([^/]+)\/.*\.json/);
						if (locale) {
							return `locale-${locale[1]}`;
						}
					},
				},
			},
		},
		optimizeDeps: {
			esbuildOptions: { target: "es2020" },
		},
		server: {
			port: 5175,
			proxy:
				MODULE && ENDPOINT
					? {
							[MODULE]: {
								target: ENDPOINT,
								changeOrigin: true,
								secure: false,
								preserveHeaderKeyCase: true,
							},
						}
					: undefined,
		},
	};
});
