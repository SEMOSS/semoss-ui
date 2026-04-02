import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
	plugins: [react()],
	base: "./", // Use relative paths for VS Code webview
	build: {
		outDir: "dist",
		sourcemap: true, // Enable source maps for easier debugging
		emptyOutDir: true, // Clean output directory before build
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, "index.html"),
			},
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
				manualChunks: undefined, // Disable code splitting for webviews
			},
		},
		minify: "esbuild",
		target: "es2020", // Updated for better modern JS support
		cssCodeSplit: false, // Single CSS file for webviews
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	optimizeDeps: {
		include: ["react", "react-dom"],
		exclude: ["vscode"],
	},
	define: {
		"process.env.NODE_ENV": JSON.stringify(
			process.env.NODE_ENV || "development",
		),
	},
	server: {
		port: 3000,
		open: false,
		strictPort: true,
	},
	css: {
		devSourcemap: true,
	},
});
