import { createViteConfig } from "@semoss/config";

// Source-exported package: no build step, so this config exists only to run
// the dock's own tests under the shared SEMOSS vitest defaults.
export default createViteConfig({
	rootDir: import.meta.dirname,
	enableTailwind: false,
	test: {
		setupFiles: ["./vitest.setup.ts"],
	},
});
