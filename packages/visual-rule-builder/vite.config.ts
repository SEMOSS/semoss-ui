import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	const isProduction = mode === "production";

	const MODULE = env.MODULE || "/Monolith";
	const ENDPOINT = env.ENDPOINT || "http://localhost:9090";

	console.log("Vite config - MODULE:", MODULE, "ENDPOINT:", ENDPOINT);

	return {
		base: "./",
		plugins: [
			tailwindcss(),
			svgr(),
			react({ include: /\.(js|jsx|ts|tsx)$/ }),
		],
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
		},
		optimizeDeps: {
			esbuildOptions: {
				target: "es2020",
			},
		},
		server: {
			port: 5175,
			proxy: {
				[MODULE]: {
					target: ENDPOINT,
					changeOrigin: true,
					secure: false,
					ws: true,
					configure: (proxy: any) => {
						proxy.on("error", (err: Error) => {
							console.log("proxy error", err);
						});
						proxy.on(
							"proxyReq",
							(
								_proxyReq: unknown,
								req: { method?: string; url?: string },
							) => {
								console.log(
									"Sending Request:",
									req.method,
									req.url,
								);
							},
						);
						proxy.on(
							"proxyRes",
							(
								proxyRes: { statusCode?: number },
								req: { url?: string },
							) => {
								console.log(
									"Received Response:",
									proxyRes.statusCode,
									req.url,
								);
							},
						);
					},
				},
			},
		},
		test: {
			css: true,
			globals: true,
			environment: "jsdom",
			clearMocks: true,
			setupFiles: ["./vitest.setup.ts"],
			browser: {
				pool: "playwright",
				instances: [{ browser: "chromium" }],
			},
		},
	};
});
