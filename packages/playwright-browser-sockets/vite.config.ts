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
			"process.env.MODULE": JSON.stringify(env.MODULE),
			"process.env.ENDPOINT": JSON.stringify(env.ENDPOINT),
			"process.env.APP": JSON.stringify(env.APP),
		},
		server: {
			port: 5174,
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
