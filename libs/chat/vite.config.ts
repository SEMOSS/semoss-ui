import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Local dev-only preview for the components — see sandbox/ and
// docs/chat-components/PLAN.md ("Storybook — investigated, decided
// against") for why this exists instead of Storybook. Not part of the
// published package; vitest.config.ts (not this file) drives `pnpm test`.
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	root: "sandbox",
	plugins: [tailwindcss(), react()],
	server: {
		port: 4300,
		strictPort: true,
		fs: {
			allow: [packageRoot],
		},
	},
});
