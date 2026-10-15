import { createViteConfig, DEV_SERVER_PORTS } from "@semoss/config";

export default createViteConfig({
	rootDir: import.meta.dirname,
	port: DEV_SERVER_PORTS.automationWorkspace,
	proxy: {
		ws: true,
		fallbackModule: "/Monolith",
		fallbackEndpoint: "http://localhost:9090/",
	},
	// Baked in at build time: this app is served from the web app rather than a
	// published project portal, so there is no semoss-env script at runtime.
	define: (env) => ({
		"import.meta.env.ENDPOINT": JSON.stringify(env.ENDPOINT),
	}),
	// The domain layer is plain TypeScript, so its tests need no DOM.
	test: {
		environment: "node",
		coverage: {
			reportsDirectory: "./coverage/packages/automation",
			include: ["src/domain/**"],
		},
	},
});
