import { mergeConfig } from "vite";
import { globSync } from "node:fs";
import { resolve } from "node:path";
import { createViteLibConfig } from "@semoss/config";

// The SDK also compiles and ships @semoss/monolith (which has no build of its own), one
// entry per route file. Every module keeps its path below libs/ (dist/sdk/src/…,
// dist/monolith/src/…, declarations the same under dist/types/), so a consumer's bundler
// keeps only what it imports, and every entry shares one ApiClient.
const LIBS = resolve(import.meta.dirname, "..");
const entries = [
	"sdk/src/index.ts",
	"sdk/src/js-frameworks/react/index.ts",
	"monolith/src/index.ts",
	...globSync("monolith/src/routes/**/*.ts", { cwd: LIBS }),
];

const base = createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: Object.fromEntries(
		entries.map((file) => [file.replace(/\.ts$/, ""), resolve(LIBS, file)]),
	),
	external: ["react", /^react\//],
});

export default (env: Parameters<typeof base>[0]) =>
	mergeConfig(base(env), {
		build: {
			rolldownOptions: {
				output: { preserveModules: true, preserveModulesRoot: LIBS },
			},
		},
	});
