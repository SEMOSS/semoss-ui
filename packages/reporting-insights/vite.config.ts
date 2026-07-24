import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const ENDPOINT = env.ENDPOINT || "http://localhost:9090";
	const MODULE = env.MODULE || "/Monolith";

	return {
		// Relative base so assets resolve when SEMOSS serves the app from a sub-path
		// (…/Monolith/public_home/<id>/portals/). Dev keeps absolute '/'.
		base: mode === "production" ? "./" : "/",
		plugins: [react()],
		resolve: {
			// Force a single React instance — prevents flexlayout-react (and any
			// other lib that bundles React) from breaking hooks at runtime.
			dedupe: ["react", "react-dom"],
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"react-is": path.resolve(__dirname, "./src/shims/react-is.ts"),
			},
		},
		build: {
			// Static build served by SemossWeb at packages/reporting-insights/dist/
			// (launched from the base app like playground).
			outDir: "./dist",
			emptyOutDir: true,
		},
		define: {
			"import.meta.env.MODULE": JSON.stringify(env.MODULE || ""),
			// Backend origin (e.g. http://localhost:9090). Exposed so we can build
			// absolute links to published apps (public_home) that point at the SEMOSS
			// backend rather than the dev server.
			"import.meta.env.ENDPOINT": JSON.stringify(env.ENDPOINT || ""),
			"import.meta.env.ACCESS_KEY": JSON.stringify(env.ACCESS_KEY || ""),
			"import.meta.env.SECRET_KEY": JSON.stringify(env.SECRET_KEY || ""),
		},
		server: {
			port: parseInt(env.VITE_PORT || "5173"),
			host: env.VITE_HOST || "localhost",
			proxy: {
				[MODULE]: {
					target: ENDPOINT,
					changeOrigin: true,
					secure: false,
				},
			},
		},
	};
});
