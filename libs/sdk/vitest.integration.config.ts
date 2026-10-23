import { createViteConfig } from "@semoss/config";

export default createViteConfig({
	rootDir: import.meta.dirname,
	enableReact: false,
	enableTailwind: false,
	test: {
		name: "sdk-integration",
		include: ["tests/integration/**/*.test.ts"],
		environment: "node",
		pool: "forks",
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
