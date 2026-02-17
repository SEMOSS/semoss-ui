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
		resolve: {
			alias: {
				"@": resolve(__dirname, "./client"),
			},
		},
		define: {
			"import.meta.env.MODULE": JSON.stringify(MODULE),
			"import.meta.env.APP": JSON.stringify(env.APP),
			"import.meta.env.ACCESS_KEY": isProduction
				? undefined
				: JSON.stringify(env.ACCESS_KEY),
			"import.meta.env.SECRET_KEY": isProduction
				? undefined
				: JSON.stringify(env.SECRET_KEY),
		},
		server: {
			proxy: {
				[MODULE]: {
					target: ENDPOINT,
					changeOrigin: true,
					secure: false,
				},
			},
		},
		build: {
			outDir: "./portals",
			emptyOutDir: true,
			minify: isProduction,
		},
		plugins: [react(), tailwindcss()],
	};
});
