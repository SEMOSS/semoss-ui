import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// Standalone build for the published portal sub-app.
// Output: portal/dist/index.html (single file after inline-build.mjs post-processing).
export default defineConfig({
	root: path.resolve(__dirname, "portal"),
	base: "./",
	plugins: [react()],
	resolve: {
		// Prevent flexlayout-react (and any other lib) from bundling its own React
		dedupe: ["react", "react-dom"],
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"react-is": path.resolve(__dirname, "./src/shims/react-is.ts"),
		},
	},
	css: {
		// Re-use the root postcss.config.js (tailwind + autoprefixer)
		postcss: path.resolve(__dirname, "postcss.config.js"),
	},
	build: {
		outDir: path.resolve(__dirname, "portal/dist"),
		emptyOutDir: true,
		rollupOptions: {
			input: path.resolve(__dirname, "portal/index.html"),
		},
	},
});
