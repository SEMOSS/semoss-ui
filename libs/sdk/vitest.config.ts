import { createViteConfig } from "@semoss/config";

export default createViteConfig({
	rootDir: import.meta.dirname,
	enableReact: false,
	enableTailwind: false,
	test: {
		environment: "node",
		pool: "forks",
		typecheck: {
			enabled: true,
			include: ["src/**/*.test-d.ts"],
			// tsconfig.json leaves type tests out of the declaration build
			tsconfig: "./tsconfig.typecheck.json",
		},
		coverage: {
			reportsDirectory: "./coverage",
			include: ["src/**"],
		},
	},
});
