import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	root: __dirname,
	base: "./",
	plugins: [tailwindcss(), react()],
	build: {
		outDir: "../dist-app-ui",
		emptyOutDir: true,
	},
});
