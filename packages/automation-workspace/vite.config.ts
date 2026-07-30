import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		plugins: [react(), tailwindcss()],
		base: "./",
		build: {
			outDir: "dist",
			emptyOutDir: true,
		},
		define: {
			// Baked in at build time. Served from the web app rather than from a
			// published project portal, so there is no semoss-env script to read
			// these from at runtime.
			"import.meta.env.MODULE": JSON.stringify(env.MODULE),
			"import.meta.env.ENDPOINT": JSON.stringify(env.ENDPOINT),
		},
		server: {
			// 5173 client, 5174 playground, 5175 terminal/auditlog, 5176 playwright-browser-sockets
			port: 5177,
			strictPort: true,
			proxy: {
				[env.MODULE || "/Monolith"]: {
					target: env.ENDPOINT || "http://localhost:9090/",
					changeOrigin: true,
					secure: false,
					preserveHeaderKeyCase: true,
					ws: true,
				},
			},
		},
	};
});
