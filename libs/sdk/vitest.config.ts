import { createViteConfig } from "@semoss/config";

export default createViteConfig({
	rootDir: import.meta.dirname,
	enableReact: false,
	enableTailwind: false,
	test: {
		include: ["src/**/*.test.{ts,tsx}"],
		environment: "node",
		pool: "forks",
		coverage: {
			reportsDirectory: "./coverage",
			include: ["src/**"],
		},
	},
});
