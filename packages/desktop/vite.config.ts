import { createViteConfig } from "@semoss/config";

const DESKTOP_DEV_PORT = 5180;

export default createViteConfig({
	rootDir: import.meta.dirname,
	port: DESKTOP_DEV_PORT,
	proxy: {
		ws: true,
		fallbackEndpoint: "http://localhost:9091",
		fallbackModule: "/Monolith",
	},
	test: {
		setupFiles: ["./vitest.setup.ts"],
	},
});
