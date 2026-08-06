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
			// dev server ports: client 5173, playground 5174, terminal 5175,
			// browser-automation 5176, auditlog 5177, chrome-extension 5178
			port: 5176,
			strictPort: true,
			proxy: {
				[env.MODULE || "/Monolith"]: {
					target: env.ENDPOINT || "http://localhost:8080/",
					changeOrigin: true,
					secure: false,
					preserveHeaderKeyCase: true,
					ws: true,
				},
			},
		},
	};
});
